package handlers

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"real-time-chat/database"
	"real-time-chat/models"
)

// GetMyProfile returns the authenticated user's profile
func GetMyProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var user models.User
	var displayName, bio, profilePicture sql.NullString
	err := database.DB.QueryRow(
		"SELECT id, email, username, display_name, bio, profile_picture, is_verified, created_at, updated_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Username, &displayName, &bio, &profilePicture, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		log.Printf("Error fetching profile: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Set optional fields
	if displayName.Valid {
		user.DisplayName = displayName.String
	}
	if bio.Valid {
		user.Bio = bio.String
	}
	if profilePicture.Valid {
		user.ProfilePicture = profilePicture.String
	}

	RespondWithJSON(w, http.StatusOK, user)
}

// UpdateProfile updates the authenticated user's profile
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" && r.Method != "PATCH" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate display name length
	if len(req.DisplayName) > 100 {
		RespondWithError(w, http.StatusBadRequest, "Display name must be less than 100 characters")
		return
	}

	// Validate bio length
	if len(req.Bio) > 500 {
		RespondWithError(w, http.StatusBadRequest, "Bio must be less than 500 characters")
		return
	}

	// Update profile
	_, err := database.DB.Exec(
		"UPDATE users SET display_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		req.DisplayName, req.Bio, userID,
	)
	if err != nil {
		log.Printf("Error updating profile: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Fetch updated profile
	var user models.User
	var displayName, bio, profilePicture sql.NullString
	err = database.DB.QueryRow(
		"SELECT id, email, username, display_name, bio, profile_picture, is_verified, created_at, updated_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Username, &displayName, &bio, &profilePicture, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		log.Printf("Error fetching updated profile: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Set optional fields
	if displayName.Valid {
		user.DisplayName = displayName.String
	}
	if bio.Valid {
		user.Bio = bio.String
	}
	if profilePicture.Valid {
		user.ProfilePicture = profilePicture.String
	}

	RespondWithJSON(w, http.StatusOK, user)
	log.Printf("Profile updated for user ID: %d", userID)
}

// UploadProfilePicture handles profile picture upload (base64)
func UploadProfilePicture(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		Image string `json:"image"` // base64 encoded image
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Image == "" {
		RespondWithError(w, http.StatusBadRequest, "Image data is required")
		return
	}

	// Validate base64 and size
	// Remove data URL prefix if present
	imageData := req.Image
	if strings.HasPrefix(imageData, "data:image") {
		parts := strings.Split(imageData, ",")
		if len(parts) != 2 {
			RespondWithError(w, http.StatusBadRequest, "Invalid image format")
			return
		}
		imageData = parts[1]
	}

	// Decode to check size (max 2MB)
	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid base64 image")
		return
	}

	if len(decoded) > 2*1024*1024 {
		RespondWithError(w, http.StatusBadRequest, "Image size must be less than 2MB")
		return
	}

	// Store the complete data URL
	profilePictureURL := req.Image
	if !strings.HasPrefix(profilePictureURL, "data:image") {
		// Add data URL prefix if not present
		profilePictureURL = "data:image/png;base64," + imageData
	}

	// Update profile picture
	_, err = database.DB.Exec(
		"UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		profilePictureURL, userID,
	)
	if err != nil {
		log.Printf("Error updating profile picture: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to upload profile picture")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Profile picture uploaded successfully",
	})

	log.Printf("Profile picture updated for user ID: %d", userID)
}

// GetUserProfile returns a user's public profile by ID or username
func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get current user ID from context (if authenticated)
	currentUserID, _ := r.Context().Value("userID").(int)

	// Get user identifier from URL
	identifier := r.URL.Query().Get("user")
	if identifier == "" {
		RespondWithError(w, http.StatusBadRequest, "User identifier is required")
		return
	}

	var profile models.UserProfile
	var targetUserID int

	// Try to parse as ID first, otherwise treat as username
	if id, err := strconv.Atoi(identifier); err == nil {
		err = database.DB.QueryRow(
			"SELECT id, username, display_name, bio, profile_picture, is_verified, created_at FROM users WHERE id = ?",
			id,
		).Scan(&profile.ID, &profile.Username, &profile.DisplayName, &profile.Bio, &profile.ProfilePicture, &profile.IsVerified, &profile.CreatedAt)
		targetUserID = id

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
			return
		} else if err != nil {
			log.Printf("Error fetching profile: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
	} else {
		// Treat as username
		err = database.DB.QueryRow(
			"SELECT id, username, display_name, bio, profile_picture, is_verified, created_at FROM users WHERE username = ?",
			identifier,
		).Scan(&profile.ID, &profile.Username, &profile.DisplayName, &profile.Bio, &profile.ProfilePicture, &profile.IsVerified, &profile.CreatedAt)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
			return
		} else if err != nil {
			log.Printf("Error fetching profile: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		targetUserID = profile.ID
	}

	// Get friendship status if user is authenticated
	if currentUserID > 0 && currentUserID != targetUserID {
		var status string
		err := database.DB.QueryRow(`
			SELECT status FROM friendships 
			WHERE (user_id = ? AND friend_id = ?) 
			   OR (user_id = ? AND friend_id = ?)
			LIMIT 1`,
			currentUserID, targetUserID, targetUserID, currentUserID,
		).Scan(&status)

		if err == nil {
			if status == "accepted" {
				profile.FriendStatus = "friend"
			} else if status == "pending" {
				// Check who requested
				var requestedBy int
				database.DB.QueryRow(`
					SELECT requested_by FROM friendships 
					WHERE (user_id = ? AND friend_id = ?) 
					   OR (user_id = ? AND friend_id = ?)`,
					currentUserID, targetUserID, targetUserID, currentUserID,
				).Scan(&requestedBy)

				if requestedBy == currentUserID {
					profile.FriendStatus = "pending_sent"
				} else {
					profile.FriendStatus = "pending_received"
				}
			} else if status == "blocked" {
				profile.FriendStatus = "blocked"
			}
		} else if err == sql.ErrNoRows {
			profile.FriendStatus = "none"
		}
	}

	RespondWithJSON(w, http.StatusOK, models.ProfileResponse{
		Profile: profile,
	})
}

// SearchUsers searches for users by username or display name
func SearchUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		RespondWithError(w, http.StatusBadRequest, "Search query is required")
		return
	}

	if len(query) < 2 {
		RespondWithError(w, http.StatusBadRequest, "Search query must be at least 2 characters")
		return
	}

	searchPattern := "%" + query + "%"

	rows, err := database.DB.Query(`
		SELECT id, username, display_name, bio, profile_picture, is_verified, created_at 
		FROM users 
		WHERE (username LIKE ? OR display_name LIKE ?) AND is_verified = TRUE
		ORDER BY username ASC
		LIMIT 20`,
		searchPattern, searchPattern,
	)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer rows.Close()

	var users []models.UserProfile
	for rows.Next() {
		var user models.UserProfile
		var displayName, bio, profilePicture sql.NullString

		err := rows.Scan(&user.ID, &user.Username, &displayName, &bio, &profilePicture, &user.IsVerified, &user.CreatedAt)
		if err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}

		if displayName.Valid {
			user.DisplayName = displayName.String
		}
		if bio.Valid {
			user.Bio = bio.String
		}
		if profilePicture.Valid {
			user.ProfilePicture = profilePicture.String
		}

		users = append(users, user)
	}

	if users == nil {
		users = []models.UserProfile{}
	}

	RespondWithJSON(w, http.StatusOK, users)
}
