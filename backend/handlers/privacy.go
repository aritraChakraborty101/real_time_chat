package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"real-time-chat/database"
	"real-time-chat/models"
)

// GetPrivacySettings returns the authenticated user's privacy settings
func GetPrivacySettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var settings models.PrivacySettings
	err := database.DB.QueryRow(`
		SELECT id, user_id, profile_picture_visibility, last_seen_visibility, created_at, updated_at 
		FROM privacy_settings 
		WHERE user_id = ?`,
		userID,
	).Scan(&settings.ID, &settings.UserID, &settings.ProfilePictureVisibility, &settings.LastSeenVisibility, &settings.CreatedAt, &settings.UpdatedAt)

	if err == sql.ErrNoRows {
		// Create default privacy settings if they don't exist
		_, err = database.DB.Exec(`
			INSERT INTO privacy_settings (user_id, profile_picture_visibility, last_seen_visibility)
			VALUES (?, 'everyone', 'everyone')`,
			userID,
		)
		if err != nil {
			log.Printf("Error creating default privacy settings: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		// Fetch the newly created settings
		err = database.DB.QueryRow(`
			SELECT id, user_id, profile_picture_visibility, last_seen_visibility, created_at, updated_at 
			FROM privacy_settings 
			WHERE user_id = ?`,
			userID,
		).Scan(&settings.ID, &settings.UserID, &settings.ProfilePictureVisibility, &settings.LastSeenVisibility, &settings.CreatedAt, &settings.UpdatedAt)

		if err != nil {
			log.Printf("Error fetching privacy settings: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
	} else if err != nil {
		log.Printf("Error fetching privacy settings: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	RespondWithJSON(w, http.StatusOK, settings)
}

// UpdatePrivacySettings updates the authenticated user's privacy settings
func UpdatePrivacySettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" && r.Method != "PATCH" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.UpdatePrivacySettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate visibility values
	validVisibilities := map[string]bool{"everyone": true, "friends": true, "nobody": true}
	if !validVisibilities[req.ProfilePictureVisibility] {
		RespondWithError(w, http.StatusBadRequest, "Invalid profile picture visibility value")
		return
	}
	if !validVisibilities[req.LastSeenVisibility] {
		RespondWithError(w, http.StatusBadRequest, "Invalid last seen visibility value")
		return
	}

	// Check if privacy settings exist
	var exists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM privacy_settings WHERE user_id = ?)", userID).Scan(&exists)
	if err != nil {
		log.Printf("Error checking privacy settings existence: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if !exists {
		// Create new privacy settings
		_, err = database.DB.Exec(`
			INSERT INTO privacy_settings (user_id, profile_picture_visibility, last_seen_visibility)
			VALUES (?, ?, ?)`,
			userID, req.ProfilePictureVisibility, req.LastSeenVisibility,
		)
	} else {
		// Update existing privacy settings
		_, err = database.DB.Exec(`
			UPDATE privacy_settings 
			SET profile_picture_visibility = ?, last_seen_visibility = ?, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?`,
			req.ProfilePictureVisibility, req.LastSeenVisibility, userID,
		)
	}

	if err != nil {
		log.Printf("Error updating privacy settings: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to update privacy settings")
		return
	}

	// Fetch updated settings
	var settings models.PrivacySettings
	err = database.DB.QueryRow(`
		SELECT id, user_id, profile_picture_visibility, last_seen_visibility, created_at, updated_at 
		FROM privacy_settings 
		WHERE user_id = ?`,
		userID,
	).Scan(&settings.ID, &settings.UserID, &settings.ProfilePictureVisibility, &settings.LastSeenVisibility, &settings.CreatedAt, &settings.UpdatedAt)

	if err != nil {
		log.Printf("Error fetching updated privacy settings: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	RespondWithJSON(w, http.StatusOK, settings)
	log.Printf("Privacy settings updated for user ID: %d", userID)
}
