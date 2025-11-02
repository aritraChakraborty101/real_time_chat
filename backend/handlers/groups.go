package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"real-time-chat/database"
	"real-time-chat/models"
)

// CreateGroup creates a new group chat
func CreateGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate group name
	if req.Name == "" {
		RespondWithError(w, http.StatusBadRequest, "Group name is required")
		return
	}

	// Validate member count (must have at least 2 members including creator)
	if len(req.MemberIDs) < 1 {
		RespondWithError(w, http.StatusBadRequest, "At least 2 members required (including you)")
		return
	}

	// Verify all members are friends
	for _, memberID := range req.MemberIDs {
		if memberID == userID {
			continue // Skip self
		}

		var friendshipExists bool
		err := database.DB.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM friendships 
				WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
				AND status = 'accepted'
			)`,
			userID, memberID, memberID, userID,
		).Scan(&friendshipExists)

		if err != nil || !friendshipExists {
			RespondWithError(w, http.StatusBadRequest, "All members must be your friends")
			return
		}
	}

	// Create group
	result, err := database.DB.Exec(`
		INSERT INTO groups (name, description, group_picture, created_by)
		VALUES (?, ?, ?, ?)`,
		req.Name, req.Description, req.GroupPicture, userID,
	)
	if err != nil {
		log.Printf("Error creating group: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	groupID, _ := result.LastInsertId()

	// Add creator as admin
	_, err = database.DB.Exec(`
		INSERT INTO group_members (group_id, user_id, role)
		VALUES (?, ?, 'admin')`,
		groupID, userID,
	)
	if err != nil {
		log.Printf("Error adding creator to group: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	// Add members
	for _, memberID := range req.MemberIDs {
		if memberID == userID {
			continue // Skip creator, already added
		}

		_, err = database.DB.Exec(`
			INSERT INTO group_members (group_id, user_id, role)
			VALUES (?, ?, 'member')`,
			groupID, memberID,
		)
		if err != nil {
			log.Printf("Error adding member to group: %v", err)
			// Continue adding other members
		}
	}

	// Fetch created group
	group, err := getGroupByID(int(groupID), userID)
	if err != nil {
		log.Printf("Error fetching created group: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Group created but failed to fetch details")
		return
	}

	RespondWithJSON(w, http.StatusCreated, group)
	log.Printf("Group created: ID %d by User %d", groupID, userID)
}

// GetUserGroups returns all groups the user is a member of
func GetUserGroups(w http.ResponseWriter, r *http.Request) {
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
		SELECT g.id, g.name, g.description, g.group_picture, g.created_by, g.created_at, g.updated_at,
			   gm.role,
			   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ?
		ORDER BY g.updated_at DESC`,
		userID,
	)
	if err != nil {
		log.Printf("Error fetching groups: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch groups")
		return
	}
	defer rows.Close()

	var groups []models.GroupWithDetails
	for rows.Next() {
		var group models.GroupWithDetails
		var description, groupPicture sql.NullString

		err := rows.Scan(
			&group.ID, &group.Name, &description, &groupPicture, &group.CreatedBy,
			&group.CreatedAt, &group.UpdatedAt, &group.UserRole, &group.MemberCount,
		)
		if err != nil {
			log.Printf("Error scanning group: %v", err)
			continue
		}

		if description.Valid {
			group.Description = description.String
		}
		if groupPicture.Valid {
			group.GroupPicture = groupPicture.String
		}

		// Get last message
		var lastMsg models.GroupMessage
		err = database.DB.QueryRow(`
			SELECT id, group_id, sender_id, content, created_at
			FROM group_messages
			WHERE group_id = ?
			ORDER BY created_at DESC
			LIMIT 1`,
			group.ID,
		).Scan(&lastMsg.ID, &lastMsg.GroupID, &lastMsg.SenderID, &lastMsg.Content, &lastMsg.CreatedAt)

		if err == nil {
			group.LastMessage = &lastMsg
		}

		groups = append(groups, group)
	}

	if groups == nil {
		groups = []models.GroupWithDetails{}
	}

	RespondWithJSON(w, http.StatusOK, groups)
}

// GetGroupDetails returns detailed information about a group
func GetGroupDetails(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	group, err := getGroupByID(groupID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Group not found or you are not a member")
		} else {
			log.Printf("Error fetching group: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch group")
		}
		return
	}

	RespondWithJSON(w, http.StatusOK, group)
}

// AddGroupMember adds a new member to the group
func AddGroupMember(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	var req models.AddGroupMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user is a member (AC3: group members can add)
	var userRole string
	err = database.DB.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = ? AND user_id = ?`,
		groupID, userID,
	).Scan(&userRole)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusForbidden, "You are not a member of this group")
		return
	} else if err != nil {
		log.Printf("Error checking membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Verify new member is a friend of the requester
	var friendshipExists bool
	err = database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM friendships 
			WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
			AND status = 'accepted'
		)`,
		userID, req.UserID, req.UserID, userID,
	).Scan(&friendshipExists)

	if err != nil || !friendshipExists {
		RespondWithError(w, http.StatusBadRequest, "Can only add your friends to the group")
		return
	}

	// Check if user is already a member
	var exists bool
	err = database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)`,
		groupID, req.UserID,
	).Scan(&exists)

	if exists {
		RespondWithError(w, http.StatusConflict, "User is already a member")
		return
	}

	// Add member
	_, err = database.DB.Exec(`
		INSERT INTO group_members (group_id, user_id, role)
		VALUES (?, ?, 'member')`,
		groupID, req.UserID,
	)
	if err != nil {
		log.Printf("Error adding member: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to add member")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Member added successfully",
	})
	log.Printf("Member %d added to group %d by user %d", req.UserID, groupID, userID)
}

// LeaveGroup allows a user to leave a group
func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	// Check if user is a member
	var role string
	err = database.DB.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = ? AND user_id = ?`,
		groupID, userID,
	).Scan(&role)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "You are not a member of this group")
		return
	} else if err != nil {
		log.Printf("Error checking membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Remove member
	_, err = database.DB.Exec(`
		DELETE FROM group_members
		WHERE group_id = ? AND user_id = ?`,
		groupID, userID,
	)
	if err != nil {
		log.Printf("Error leaving group: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to leave group")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Left group successfully",
	})
	log.Printf("User %d left group %d", userID, groupID)
}

// RemoveGroupMember removes a member from the group (admin only)
func RemoveGroupMember(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	var req models.AddGroupMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if requester is an admin
	var userRole string
	err = database.DB.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = ? AND user_id = ?`,
		groupID, userID,
	).Scan(&userRole)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusForbidden, "You are not a member of this group")
		return
	} else if err != nil {
		log.Printf("Error checking membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if userRole != "admin" {
		RespondWithError(w, http.StatusForbidden, "Only admins can remove members")
		return
	}

	// Cannot remove self using this endpoint
	if req.UserID == userID {
		RespondWithError(w, http.StatusBadRequest, "Use leave endpoint to remove yourself")
		return
	}

	// Remove member
	result, err := database.DB.Exec(`
		DELETE FROM group_members
		WHERE group_id = ? AND user_id = ?`,
		groupID, req.UserID,
	)
	if err != nil {
		log.Printf("Error removing member: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to remove member")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		RespondWithError(w, http.StatusNotFound, "Member not found in group")
		return
	}

	RespondWithJSON(w, http.StatusOK, models.SuccessResponse{
		Message: "Member removed successfully",
	})
	log.Printf("User %d removed from group %d by admin %d", req.UserID, groupID, userID)
}

// SendGroupMessage sends a message to a group
func SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	var req models.SendGroupMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Content == "" {
		RespondWithError(w, http.StatusBadRequest, "Message content cannot be empty")
		return
	}

	// Check if user is a member
	var exists bool
	err = database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)`,
		groupID, userID,
	).Scan(&exists)

	if err != nil || !exists {
		RespondWithError(w, http.StatusForbidden, "You are not a member of this group")
		return
	}

	// Insert message
	result, err := database.DB.Exec(`
		INSERT INTO group_messages (group_id, sender_id, content)
		VALUES (?, ?, ?)`,
		groupID, userID, req.Content,
	)
	if err != nil {
		log.Printf("Error sending group message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	messageID, _ := result.LastInsertId()

	// Update group timestamp
	_, _ = database.DB.Exec(`
		UPDATE groups 
		SET updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?`,
		groupID,
	)

	// Fetch the created message
	var message models.GroupMessage
	err = database.DB.QueryRow(`
		SELECT id, group_id, sender_id, content, created_at
		FROM group_messages WHERE id = ?`,
		messageID,
	).Scan(&message.ID, &message.GroupID, &message.SenderID, &message.Content, &message.CreatedAt)

	if err != nil {
		log.Printf("Error fetching message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
	}

	RespondWithJSON(w, http.StatusCreated, models.GroupMessageResponse{Message: message})
	log.Printf("Group message sent: User %d -> Group %d", userID, groupID)
}

// GetGroupMessages returns all messages in a group
func GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "group_id parameter is required")
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid group_id")
		return
	}

	// Check if user is a member
	var exists bool
	err = database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)`,
		groupID, userID,
	).Scan(&exists)

	if err != nil || !exists {
		RespondWithError(w, http.StatusForbidden, "You are not a member of this group")
		return
	}

	// Fetch messages with sender info
	rows, err := database.DB.Query(`
		SELECT gm.id, gm.group_id, gm.sender_id, gm.content, gm.created_at,
			   u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at
		FROM group_messages gm
		JOIN users u ON gm.sender_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC`,
		groupID,
	)
	if err != nil {
		log.Printf("Error fetching messages: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	defer rows.Close()

	var messages []models.GroupMessage
	for rows.Next() {
		var message models.GroupMessage
		var sender models.UserProfile
		var displayName, bio, profilePicture sql.NullString

		err := rows.Scan(
			&message.ID, &message.GroupID, &message.SenderID, &message.Content, &message.CreatedAt,
			&sender.ID, &sender.Username, &displayName, &bio, &profilePicture,
			&sender.IsVerified, &sender.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning message: %v", err)
			continue
		}

		if displayName.Valid {
			sender.DisplayName = displayName.String
		}
		if bio.Valid {
			sender.Bio = bio.String
		}
		if profilePicture.Valid {
			sender.ProfilePicture = profilePicture.String
		}

		message.Sender = &sender
		messages = append(messages, message)
	}

	if messages == nil {
		messages = []models.GroupMessage{}
	}

	RespondWithJSON(w, http.StatusOK, messages)
}

// Helper function to get group by ID with details
func getGroupByID(groupID, userID int) (*models.GroupWithDetails, error) {
	var group models.GroupWithDetails
	var description, groupPicture sql.NullString
	var userRole string

	// Get group basic info and user's role
	err := database.DB.QueryRow(`
		SELECT g.id, g.name, g.description, g.group_picture, g.created_by, g.created_at, g.updated_at,
			   gm.role
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE g.id = ? AND gm.user_id = ?`,
		groupID, userID,
	).Scan(&group.ID, &group.Name, &description, &groupPicture, &group.CreatedBy,
		&group.CreatedAt, &group.UpdatedAt, &userRole)

	if err != nil {
		return nil, err
	}

	if description.Valid {
		group.Description = description.String
	}
	if groupPicture.Valid {
		group.GroupPicture = groupPicture.String
	}
	group.UserRole = userRole

	// Get member count
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_members WHERE group_id = ?`,
		groupID,
	).Scan(&group.MemberCount)

	// Get members
	rows, err := database.DB.Query(`
		SELECT gm.id, gm.group_id, gm.role, gm.joined_at,
			   u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.joined_at ASC`,
		groupID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var member models.GroupMemberWithUser
			var displayName, bio, profilePicture sql.NullString

			err := rows.Scan(
				&member.ID, &member.GroupID, &member.Role, &member.JoinedAt,
				&member.User.ID, &member.User.Username, &displayName, &bio, &profilePicture,
				&member.User.IsVerified, &member.User.CreatedAt,
			)
			if err == nil {
				if displayName.Valid {
					member.User.DisplayName = displayName.String
				}
				if bio.Valid {
					member.User.Bio = bio.String
				}
				if profilePicture.Valid {
					member.User.ProfilePicture = profilePicture.String
				}
				group.Members = append(group.Members, member)
			}
		}
	}

	return &group, nil
}
