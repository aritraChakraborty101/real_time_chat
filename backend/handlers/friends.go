package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"real-time-chat/database"
	"real-time-chat/models"
)

// SendFriendRequest sends a friend request to another user
func SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.FriendID == userID {
		RespondWithError(w, http.StatusBadRequest, "Cannot send friend request to yourself")
		return
	}

	// Check if friend exists
	var friendExists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", req.FriendID).Scan(&friendExists)
	if err != nil || !friendExists {
		RespondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Check if friendship already exists
	var existingStatus string
	err = database.DB.QueryRow(`
		SELECT status FROM friendships 
		WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
		userID, req.FriendID, req.FriendID, userID,
	).Scan(&existingStatus)

	if err == nil {
		if existingStatus == "accepted" {
			RespondWithError(w, http.StatusConflict, "Already friends")
			return
		} else if existingStatus == "pending" {
			RespondWithError(w, http.StatusConflict, "Friend request already sent")
			return
		} else if existingStatus == "blocked" {
			RespondWithError(w, http.StatusForbidden, "Cannot send friend request")
			return
		}
	}

	// Create friend request
	_, err = database.DB.Exec(`
		INSERT INTO friendships (user_id, friend_id, status, requested_by)
		VALUES (?, ?, 'pending', ?)`,
		userID, req.FriendID, userID,
	)
	if err != nil {
		log.Printf("Error creating friend request: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to send friend request")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Friend request sent successfully",
	})

	log.Printf("Friend request sent: User %d -> User %d", userID, req.FriendID)
}

// RespondToFriendRequest accepts or rejects a friend request
func RespondToFriendRequest(w http.ResponseWriter, r *http.Request) {
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
		FriendID int    `json:"friend_id"`
		Action   string `json:"action"` // "accept" or "reject"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Action != "accept" && req.Action != "reject" {
		RespondWithError(w, http.StatusBadRequest, "Action must be 'accept' or 'reject'")
		return
	}

	// Check if friend request exists and is pending
	var friendshipID int
	var requestedBy int
	err := database.DB.QueryRow(`
		SELECT id, requested_by FROM friendships 
		WHERE (user_id = ? AND friend_id = ? OR user_id = ? AND friend_id = ?) 
		AND status = 'pending'`,
		req.FriendID, userID, userID, req.FriendID,
	).Scan(&friendshipID, &requestedBy)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "Friend request not found")
		return
	} else if err != nil {
		log.Printf("Error checking friend request: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Verify that the current user is the one who received the request
	if requestedBy == userID {
		RespondWithError(w, http.StatusForbidden, "Cannot respond to your own friend request")
		return
	}

	if req.Action == "accept" {
		_, err = database.DB.Exec(
			"UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			friendshipID,
		)
		if err != nil {
			log.Printf("Error accepting friend request: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to accept friend request")
			return
		}

		RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
			Message: "Friend request accepted",
		})
		log.Printf("Friend request accepted: ID %d", friendshipID)
	} else {
		_, err = database.DB.Exec(
			"DELETE FROM friendships WHERE id = ?",
			friendshipID,
		)
		if err != nil {
			log.Printf("Error rejecting friend request: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to reject friend request")
			return
		}

		RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
			Message: "Friend request rejected",
		})
		log.Printf("Friend request rejected: ID %d", friendshipID)
	}
}

// GetFriendRequests returns pending friend requests
func GetFriendRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := database.DB.Query(`
		SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at,
		       u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at
		FROM friendships f
		JOIN users u ON (
			CASE 
				WHEN f.requested_by = u.id AND f.friend_id = ? THEN 1
				ELSE 0
			END = 1
		)
		WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'pending' AND f.requested_by != ?
		ORDER BY f.created_at DESC`,
		userID, userID, userID, userID,
	)
	if err != nil {
		log.Printf("Error fetching friend requests: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer rows.Close()

	var requests []models.FriendRequestResponse
	for rows.Next() {
		var req models.FriendRequestResponse
		var displayName, bio, profilePicture sql.NullString

		err := rows.Scan(
			&req.ID, &req.UserID, &req.FriendID, &req.Status, &req.CreatedAt,
			&req.Friend.ID, &req.Friend.Username, &displayName, &bio, &profilePicture,
			&req.Friend.IsVerified, &req.Friend.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning friend request: %v", err)
			continue
		}

		if displayName.Valid {
			req.Friend.DisplayName = displayName.String
		}
		if bio.Valid {
			req.Friend.Bio = bio.String
		}
		if profilePicture.Valid {
			req.Friend.ProfilePicture = profilePicture.String
		}

		requests = append(requests, req)
	}

	if requests == nil {
		requests = []models.FriendRequestResponse{}
	}

	RespondWithJSON(w, http.StatusOK, requests)
}

// GetFriends returns list of friends
func GetFriends(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := database.DB.Query(`
		SELECT u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at
		FROM users u
		JOIN friendships f ON (
			(f.user_id = ? AND f.friend_id = u.id) OR
			(f.friend_id = ? AND f.user_id = u.id)
		)
		WHERE f.status = 'accepted'
		ORDER BY u.username ASC`,
		userID, userID,
	)
	if err != nil {
		log.Printf("Error fetching friends: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer rows.Close()

	var friends []models.UserProfile
	for rows.Next() {
		var friend models.UserProfile
		var displayName, bio, profilePicture sql.NullString

		err := rows.Scan(&friend.ID, &friend.Username, &displayName, &bio, &profilePicture, &friend.IsVerified, &friend.CreatedAt)
		if err != nil {
			log.Printf("Error scanning friend: %v", err)
			continue
		}

		if displayName.Valid {
			friend.DisplayName = displayName.String
		}
		if bio.Valid {
			friend.Bio = bio.String
		}
		if profilePicture.Valid {
			friend.ProfilePicture = profilePicture.String
		}

		friend.FriendStatus = "friend"
		friends = append(friends, friend)
	}

	if friends == nil {
		friends = []models.UserProfile{}
	}

	RespondWithJSON(w, http.StatusOK, friends)
}

// RemoveFriend removes a friend
func RemoveFriend(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	result, err := database.DB.Exec(`
		DELETE FROM friendships 
		WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
		AND status = 'accepted'`,
		userID, req.FriendID, req.FriendID, userID,
	)
	if err != nil {
		log.Printf("Error removing friend: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to remove friend")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "Friend not found")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Friend removed successfully",
	})

	log.Printf("Friend removed: User %d removed User %d", userID, req.FriendID)
}
