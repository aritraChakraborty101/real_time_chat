package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"real-time-chat/database"
	"real-time-chat/models"
	"real-time-chat/utils"
)

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, models.ErrorResponse{Error: message})
}

func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate email
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !utils.ValidateEmail(req.Email) {
		RespondWithError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate username
	req.Username = strings.TrimSpace(req.Username)
	if err := utils.ValidateUsername(req.Username); err != nil {
		RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate password
	if err := utils.ValidatePassword(req.Password); err != nil {
		RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check if email already exists
	var existingID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existingID)
	if err == nil {
		RespondWithError(w, http.StatusConflict, "Email already registered")
		return
	} else if err != sql.ErrNoRows {
		log.Printf("Database error checking email: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Check if username already exists
	err = database.DB.QueryRow("SELECT id FROM users WHERE username = ?", req.Username).Scan(&existingID)
	if err == nil {
		RespondWithError(w, http.StatusConflict, "Username already taken")
		return
	} else if err != sql.ErrNoRows {
		log.Printf("Database error checking username: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Generate verification token
	verificationToken, err := utils.GenerateVerificationToken()
	if err != nil {
		log.Printf("Error generating token: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Insert user into database
	result, err := database.DB.Exec(
		"INSERT INTO users (email, username, password, verification_token) VALUES (?, ?, ?, ?)",
		req.Email, req.Username, hashedPassword, verificationToken,
	)
	if err != nil {
		log.Printf("Error inserting user: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	userID, _ := result.LastInsertId()

	// Send verification email
	go utils.SendVerificationEmail(req.Email, verificationToken)

	RespondWithJSON(w, http.StatusCreated, models.SuccessResponse{
		Message: "Registration successful! Please check your email to verify your account.",
	})

	log.Printf("User registered: ID=%d, Email=%s, Username=%s", userID, req.Email, req.Username)
}

// VerifyEmail handles email verification
func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" && r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	token := r.URL.Query().Get("token")
	if token == "" {
		// Try to get token from POST body
		var req struct {
			Token string `json:"token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			token = req.Token
		}
	}

	if token == "" {
		RespondWithError(w, http.StatusBadRequest, "Verification token is required")
		return
	}

	// Check if user is already verified with this token
	var isVerified bool
	var userID int
	err := database.DB.QueryRow(
		"SELECT id, is_verified FROM users WHERE verification_token = ?",
		token,
	).Scan(&userID, &isVerified)

	if err == sql.ErrNoRows {
		// Token doesn't exist, check if user is already verified
		err = database.DB.QueryRow(
			"SELECT id FROM users WHERE verification_token IS NULL AND is_verified = TRUE",
		).Scan(&userID)
		
		if err == nil {
			// User already verified, return success
			RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
				Message: "Email already verified! You can log in.",
			})
			return
		}
		
		RespondWithError(w, http.StatusBadRequest, "Invalid or expired verification token")
		return
	} else if err != nil {
		log.Printf("Error checking verification: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// If already verified, return success
	if isVerified {
		RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
			Message: "Email already verified! You can log in.",
		})
		log.Printf("Email already verified for user ID: %d", userID)
		return
	}

	// Update user verification status
	result, err := database.DB.Exec(
		"UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?",
		token,
	)
	if err != nil {
		log.Printf("Error verifying email: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusBadRequest, "Invalid or expired verification token")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Email verified successfully! You can now log in.",
	})

	log.Printf("Email verified with token: %s for user ID: %d", token, userID)
}

// Login handles user login
func Login(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Get user from database
	var user models.User
	var password string
	err := database.DB.QueryRow(
		"SELECT id, email, username, password, is_verified, created_at, updated_at FROM users WHERE email = ?",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Username, &password, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	} else if err != nil {
		log.Printf("Database error: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Check if email is verified
	if !user.IsVerified {
		RespondWithError(w, http.StatusForbidden, "Please verify your email before logging in")
		return
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, password) {
		RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.AuthResponse{
		Token:   token,
		User:    user,
		Message: "Login successful",
	})

	log.Printf("User logged in: ID=%d, Email=%s", user.ID, user.Email)
}
