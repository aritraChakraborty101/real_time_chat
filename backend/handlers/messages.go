package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"real-time-chat/database"
	"real-time-chat/models"
)

// GetOrCreateConversation gets or creates a conversation between two users
func getOrCreateConversation(user1ID, user2ID int) (int, error) {
	// Ensure user1ID < user2ID for consistent ordering
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	var conversationID int
	err := database.DB.QueryRow(`
		SELECT id FROM conversations 
		WHERE user1_id = ? AND user2_id = ?`,
		user1ID, user2ID,
	).Scan(&conversationID)

	if err == sql.ErrNoRows {
		// Create new conversation
		result, err := database.DB.Exec(`
			INSERT INTO conversations (user1_id, user2_id) 
			VALUES (?, ?)`,
			user1ID, user2ID,
		)
		if err != nil {
			return 0, err
		}

		id, err := result.LastInsertId()
		if err != nil {
			return 0, err
		}
		return int(id), nil
	} else if err != nil {
		return 0, err
	}

	return conversationID, nil
}

// SendMessage sends a message to a friend
func SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.SendMessageWithReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Content == "" {
		RespondWithError(w, http.StatusBadRequest, "Message content cannot be empty")
		return
	}

	if req.RecipientID == userID {
		RespondWithError(w, http.StatusBadRequest, "Cannot send message to yourself")
		return
	}

	// Check if users are friends
	var friendshipExists bool
	err := database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM friendships 
			WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
			AND status = 'accepted'
		)`,
		userID, req.RecipientID, req.RecipientID, userID,
	).Scan(&friendshipExists)

	if err != nil || !friendshipExists {
		RespondWithError(w, http.StatusForbidden, "Can only send messages to friends")
		return
	}

	// Get or create conversation
	conversationID, err := getOrCreateConversation(userID, req.RecipientID)
	if err != nil {
		log.Printf("Error creating conversation: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create conversation")
		return
	}

	// Validate reply_to_message_id if provided
	if req.ReplyToMessageID != nil {
		var msgConvID int
		err = database.DB.QueryRow(`
			SELECT conversation_id FROM messages WHERE id = ?`, *req.ReplyToMessageID,
		).Scan(&msgConvID)
		
		if err != nil || msgConvID != conversationID {
			RespondWithError(w, http.StatusBadRequest, "Invalid reply_to_message_id")
			return
		}
	}

	// Insert message
	result, err := database.DB.Exec(`
		INSERT INTO messages (conversation_id, sender_id, content, reply_to_message_id)
		VALUES (?, ?, ?, ?)`,
		conversationID, userID, req.Content, req.ReplyToMessageID,
	)
	if err != nil {
		log.Printf("Error inserting message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	messageID, _ := result.LastInsertId()

	// Update conversation timestamp
	_, _ = database.DB.Exec(`
		UPDATE conversations 
		SET updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?`,
		conversationID,
	)

	// Fetch the created message
	var message models.Message
	var editedAt sql.NullTime
	var replyToMsgID sql.NullInt64
	err = database.DB.QueryRow(`
		SELECT id, conversation_id, sender_id, content, status, is_deleted, deleted_for_everyone, 
		       is_edited, edited_at, reply_to_message_id, created_at
		FROM messages WHERE id = ?`,
		messageID,
	).Scan(&message.ID, &message.ConversationID, &message.SenderID, &message.Content, &message.Status,
		&message.IsDeleted, &message.DeletedForEveryone, &message.IsEdited, &editedAt, &replyToMsgID, &message.CreatedAt)

	if err != nil {
		log.Printf("Error fetching message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
	}

	if editedAt.Valid {
		message.EditedAt = &editedAt.Time
	}
	if replyToMsgID.Valid {
		msgID := int(replyToMsgID.Int64)
		message.ReplyToMessageID = &msgID
	}

	RespondWithJSON(w, http.StatusCreated, models.MessageResponse{Message: message})
	log.Printf("Message sent: User %d -> User %d (Conversation %d)", userID, req.RecipientID, conversationID)
}

// GetConversations returns all conversations for the current user
func GetConversations(w http.ResponseWriter, r *http.Request) {
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
		SELECT DISTINCT c.id, c.user1_id, c.user2_id, c.updated_at,
			u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at,
			m.id, m.conversation_id, m.sender_id, m.content, m.status, m.created_at,
			CASE WHEN mc.id IS NOT NULL THEN 1 ELSE 0 END as is_muted
		FROM conversations c
		JOIN users u ON (
			CASE 
				WHEN c.user1_id = ? THEN u.id = c.user2_id
				WHEN c.user2_id = ? THEN u.id = c.user1_id
			END
		)
		LEFT JOIN messages m ON m.id = (
			SELECT id FROM messages 
			WHERE conversation_id = c.id 
			ORDER BY created_at DESC 
			LIMIT 1
		)
		LEFT JOIN muted_conversations mc ON mc.conversation_id = c.id AND mc.user_id = ?
		WHERE c.user1_id = ? OR c.user2_id = ?
		ORDER BY c.updated_at DESC`,
		userID, userID, userID, userID, userID,
	)
	if err != nil {
		log.Printf("Error fetching conversations: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch conversations")
		return
	}
	defer rows.Close()

	var conversations []models.ConversationWithUser
	for rows.Next() {
		var conv models.ConversationWithUser
		var displayName, bio, profilePicture sql.NullString
		var msgID, msgConvID, msgSenderID sql.NullInt64
		var msgContent, msgStatus sql.NullString
		var msgCreatedAt sql.NullTime
		var isMuted int

		err := rows.Scan(
			&conv.ID, &conv.OtherUser.ID, &conv.OtherUser.ID, &conv.UpdatedAt,
			&conv.OtherUser.ID, &conv.OtherUser.Username, &displayName, &bio, &profilePicture,
			&conv.OtherUser.IsVerified, &conv.OtherUser.CreatedAt,
			&msgID, &msgConvID, &msgSenderID, &msgContent, &msgStatus, &msgCreatedAt,
			&isMuted,
		)
		if err != nil {
			log.Printf("Error scanning conversation: %v", err)
			continue
		}

		if displayName.Valid {
			conv.OtherUser.DisplayName = displayName.String
		}
		if bio.Valid {
			conv.OtherUser.Bio = bio.String
		}
		if profilePicture.Valid {
			conv.OtherUser.ProfilePicture = profilePicture.String
		}

		if msgID.Valid {
			conv.LastMessage = &models.Message{
				ID:             int(msgID.Int64),
				ConversationID: int(msgConvID.Int64),
				SenderID:       int(msgSenderID.Int64),
				Content:        msgContent.String,
				Status:         msgStatus.String,
				CreatedAt:      msgCreatedAt.Time,
			}
		}

		conv.UnreadCount = 0 // TODO: Implement unread count
		conv.IsMuted = isMuted == 1

		conversations = append(conversations, conv)
	}

	if conversations == nil {
		conversations = []models.ConversationWithUser{}
	}

	RespondWithJSON(w, http.StatusOK, conversations)
}

// GetMessages returns all messages for a conversation with a specific user
func GetMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	friendIDStr := r.URL.Query().Get("friend_id")
	if friendIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "friend_id parameter is required")
		return
	}

	friendID, err := strconv.Atoi(friendIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid friend_id")
		return
	}

	// Check if users are friends
	var friendshipExists bool
	err = database.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM friendships 
			WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
			AND status = 'accepted'
		)`,
		userID, friendID, friendID, userID,
	).Scan(&friendshipExists)

	if err != nil || !friendshipExists {
		RespondWithError(w, http.StatusForbidden, "Can only view messages with friends")
		return
	}

	// Get conversation ID
	user1ID, user2ID := userID, friendID
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	var conversationID int
	err = database.DB.QueryRow(`
		SELECT id FROM conversations 
		WHERE user1_id = ? AND user2_id = ?`,
		user1ID, user2ID,
	).Scan(&conversationID)

	if err == sql.ErrNoRows {
		// No conversation yet, return empty array
		RespondWithJSON(w, http.StatusOK, []models.Message{})
		return
	} else if err != nil {
		log.Printf("Error fetching conversation: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch conversation")
		return
	}

	// Fetch messages
	rows, err := database.DB.Query(`
		SELECT id, conversation_id, sender_id, content, status, is_deleted, deleted_for_everyone,
		       is_edited, edited_at, reply_to_message_id, created_at
		FROM messages
		WHERE conversation_id = ?
		ORDER BY created_at ASC`,
		conversationID,
	)
	if err != nil {
		log.Printf("Error fetching messages: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var message models.Message
		var editedAt sql.NullTime
		var replyToMsgID sql.NullInt64
		err := rows.Scan(&message.ID, &message.ConversationID, &message.SenderID, &message.Content, &message.Status,
			&message.IsDeleted, &message.DeletedForEveryone, &message.IsEdited, &editedAt, &replyToMsgID, &message.CreatedAt)
		if err != nil {
			log.Printf("Error scanning message: %v", err)
			continue
		}
		
		if editedAt.Valid {
			message.EditedAt = &editedAt.Time
		}
		if replyToMsgID.Valid {
			msgID := int(replyToMsgID.Int64)
			message.ReplyToMessageID = &msgID
			
			// Optionally fetch the replied-to message
			var repliedMsg models.Message
			err = database.DB.QueryRow(`
				SELECT id, conversation_id, sender_id, content, created_at
				FROM messages WHERE id = ?`, msgID,
			).Scan(&repliedMsg.ID, &repliedMsg.ConversationID, &repliedMsg.SenderID, &repliedMsg.Content, &repliedMsg.CreatedAt)
			if err == nil {
				message.ReplyToMessage = &repliedMsg
			}
		}
		
		messages = append(messages, message)
	}

	if messages == nil {
		messages = []models.Message{}
	}

	RespondWithJSON(w, http.StatusOK, messages)
}

// UpdateMessageStatus updates the status of messages (delivered/read)
func UpdateMessageStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.UpdateMessageStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.MessageIDs) == 0 {
		RespondWithError(w, http.StatusBadRequest, "No message IDs provided")
		return
	}

	if req.Status != "delivered" && req.Status != "read" {
		RespondWithError(w, http.StatusBadRequest, "Invalid status. Must be 'delivered' or 'read'")
		return
	}

	// Build query to update messages where current user is the recipient
	placeholders := ""
	args := []interface{}{}
	for i, msgID := range req.MessageIDs {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, msgID)
	}
	args = append(args, req.Status)
	args = append(args, userID)

	query := `
		UPDATE messages 
		SET status = ?
		WHERE id IN (` + placeholders + `)
		AND sender_id != ?
		AND conversation_id IN (
			SELECT id FROM conversations 
			WHERE user1_id = ? OR user2_id = ?
		)`
	args = append(args, userID, userID)

	result, err := database.DB.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating message status: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to update message status")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":        "Message status updated",
		"rows_affected":  rowsAffected,
		"status":         req.Status,
	})
}

// MarkConversationAsRead marks all messages in a conversation as read
func MarkConversationAsRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	friendIDStr := r.URL.Query().Get("friend_id")
	if friendIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "friend_id parameter is required")
		return
	}

	friendID, err := strconv.Atoi(friendIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid friend_id")
		return
	}

	// Get conversation ID
	user1ID, user2ID := userID, friendID
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	var conversationID int
	err = database.DB.QueryRow(`
		SELECT id FROM conversations 
		WHERE user1_id = ? AND user2_id = ?`,
		user1ID, user2ID,
	).Scan(&conversationID)

	if err == sql.ErrNoRows {
		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "No conversation found"})
		return
	} else if err != nil {
		log.Printf("Error fetching conversation: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch conversation")
		return
	}

	// Mark all messages from friend as read
	result, err := database.DB.Exec(`
		UPDATE messages 
		SET status = 'read'
		WHERE conversation_id = ?
		AND sender_id = ?
		AND status != 'read'`,
		conversationID, friendID,
	)
	if err != nil {
		log.Printf("Error marking messages as read: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to mark messages as read")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Messages marked as read",
		"rows_affected": rowsAffected,
	})
}

// In-memory typing status store (for simple implementation)
// In production, use Redis or similar for distributed systems
var typingStatus = make(map[string]map[int]bool) // map[conversationKey]map[userID]isTyping

// UpdateTypingStatus updates the typing status for a user in a conversation
func UpdateTypingStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	friendIDStr := r.URL.Query().Get("friend_id")
	isTypingStr := r.URL.Query().Get("is_typing")
	
	if friendIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "friend_id parameter is required")
		return
	}

	friendID, err := strconv.Atoi(friendIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid friend_id")
		return
	}

	isTyping := isTypingStr == "true"

	// Create conversation key (consistent ordering)
	user1ID, user2ID := userID, friendID
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}
	convKey := strconv.Itoa(user1ID) + "_" + strconv.Itoa(user2ID)

	// Update typing status
	if typingStatus[convKey] == nil {
		typingStatus[convKey] = make(map[int]bool)
	}
	typingStatus[convKey][userID] = isTyping

	// Clean up if not typing
	if !isTyping {
		delete(typingStatus[convKey], userID)
		if len(typingStatus[convKey]) == 0 {
			delete(typingStatus, convKey)
		}
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":   "Typing status updated",
		"is_typing": isTyping,
	})
}

// GetTypingStatus returns whether the other user is typing
func GetTypingStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	friendIDStr := r.URL.Query().Get("friend_id")
	if friendIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "friend_id parameter is required")
		return
	}

	friendID, err := strconv.Atoi(friendIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid friend_id")
		return
	}

	// Create conversation key (consistent ordering)
	user1ID, user2ID := userID, friendID
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}
	convKey := strconv.Itoa(user1ID) + "_" + strconv.Itoa(user2ID)

	// Check if friend is typing
	isTyping := false
	if typingStatus[convKey] != nil {
		isTyping = typingStatus[convKey][friendID]
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"is_typing": isTyping,
		"user_id":   friendID,
	})
}

// DeleteMessage deletes a message (for me or for everyone)
func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" && r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.DeleteMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify user owns the message
	var senderID int
	err := database.DB.QueryRow(`
		SELECT sender_id FROM messages WHERE id = ?`, req.MessageID,
	).Scan(&senderID)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "Message not found")
		return
	} else if err != nil {
		log.Printf("Error fetching message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
	}

	if senderID != userID {
		RespondWithError(w, http.StatusForbidden, "You can only delete your own messages")
		return
	}

	// Check if message is within edit time frame (15 minutes for delete for everyone)
	if req.DeleteForEveryone {
		var createdAt time.Time
		err = database.DB.QueryRow(`
			SELECT created_at FROM messages WHERE id = ?`, req.MessageID,
		).Scan(&createdAt)

		if err != nil {
			log.Printf("Error checking message time: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to verify message")
			return
		}

		timeSinceCreation := time.Since(createdAt)
		if timeSinceCreation > 15*time.Minute {
			RespondWithError(w, http.StatusBadRequest, "Can only delete for everyone within 15 minutes")
			return
		}

		// Delete for everyone
		_, err = database.DB.Exec(`
			UPDATE messages 
			SET is_deleted = TRUE, deleted_for_everyone = TRUE, content = 'This message was deleted'
			WHERE id = ?`, req.MessageID,
		)
	} else {
		// Delete for me only
		_, err = database.DB.Exec(`
			UPDATE messages 
			SET is_deleted = TRUE
			WHERE id = ?`, req.MessageID,
		)
	}

	if err != nil {
		log.Printf("Error deleting message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete message")
		return
	}

	RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":             "Message deleted successfully",
		"delete_for_everyone": req.DeleteForEveryone,
	})
}

// EditMessage edits a message within the time frame
func EditMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" && r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.EditMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.NewContent == "" {
		RespondWithError(w, http.StatusBadRequest, "Message content cannot be empty")
		return
	}

	// Verify user owns the message and check time
	var senderID int
	var createdAt time.Time
	var isDeleted bool
	err := database.DB.QueryRow(`
		SELECT sender_id, created_at, is_deleted FROM messages WHERE id = ?`, req.MessageID,
	).Scan(&senderID, &createdAt, &isDeleted)

	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "Message not found")
		return
	} else if err != nil {
		log.Printf("Error fetching message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
	}

	if senderID != userID {
		RespondWithError(w, http.StatusForbidden, "You can only edit your own messages")
		return
	}

	if isDeleted {
		RespondWithError(w, http.StatusBadRequest, "Cannot edit a deleted message")
		return
	}

	// Check if message is within edit time frame (15 minutes)
	timeSinceCreation := time.Since(createdAt)
	if timeSinceCreation > 15*time.Minute {
		RespondWithError(w, http.StatusBadRequest, "Can only edit messages within 15 minutes of sending")
		return
	}

	// Update message
	_, err = database.DB.Exec(`
		UPDATE messages 
		SET content = ?, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP
		WHERE id = ?`, req.NewContent, req.MessageID,
	)

	if err != nil {
		log.Printf("Error editing message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to edit message")
		return
	}

	// Fetch updated message
	var message models.Message
	var editedAt sql.NullTime
	var replyToMsgID sql.NullInt64
	err = database.DB.QueryRow(`
		SELECT id, conversation_id, sender_id, content, status, is_deleted, deleted_for_everyone,
		       is_edited, edited_at, reply_to_message_id, created_at
		FROM messages WHERE id = ?`, req.MessageID,
	).Scan(&message.ID, &message.ConversationID, &message.SenderID, &message.Content, &message.Status,
		&message.IsDeleted, &message.DeletedForEveryone, &message.IsEdited, &editedAt, &replyToMsgID, &message.CreatedAt)

	if err != nil {
		log.Printf("Error fetching updated message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch updated message")
		return
	}

	if editedAt.Valid {
		message.EditedAt = &editedAt.Time
	}
	if replyToMsgID.Valid {
		msgID := int(replyToMsgID.Int64)
		message.ReplyToMessageID = &msgID
	}

	RespondWithJSON(w, http.StatusOK, models.MessageResponse{Message: message})
}

// SearchMessages searches through user's chat history
func SearchMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		RespondWithError(w, http.StatusBadRequest, "Search query is required")
		return
	}

	searchPattern := "%" + query + "%"

	// Search in one-to-one messages
	rows, err := database.DB.Query(`
		SELECT m.id, m.conversation_id, m.sender_id, m.content, m.status, m.is_deleted, 
		       m.deleted_for_everyone, m.is_edited, m.edited_at, m.reply_to_message_id, m.created_at,
		       c.user1_id, c.user2_id,
		       u.id, u.username, u.display_name, u.bio, u.profile_picture, u.is_verified, u.created_at
		FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		JOIN users u ON (
			CASE 
				WHEN c.user1_id = ? THEN u.id = c.user2_id
				WHEN c.user2_id = ? THEN u.id = c.user1_id
			END
		)
		WHERE (c.user1_id = ? OR c.user2_id = ?)
		AND m.content LIKE ?
		AND m.deleted_for_everyone = FALSE
		ORDER BY m.created_at DESC
		LIMIT 50`,
		userID, userID, userID, userID, searchPattern,
	)
	if err != nil {
		log.Printf("Error searching messages: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to search messages")
		return
	}
	defer rows.Close()

	var results []models.MessageSearchResult
	for rows.Next() {
		var result models.MessageSearchResult
		var editedAt sql.NullTime
		var replyToMsgID sql.NullInt64
		var displayName, bio, profilePicture sql.NullString
		var user1ID, user2ID int

		err := rows.Scan(
			&result.Message.ID, &result.Message.ConversationID, &result.Message.SenderID,
			&result.Message.Content, &result.Message.Status, &result.Message.IsDeleted,
			&result.Message.DeletedForEveryone, &result.Message.IsEdited, &editedAt,
			&replyToMsgID, &result.Message.CreatedAt,
			&user1ID, &user2ID,
			&result.OtherUser.ID, &result.OtherUser.Username, &displayName, &bio,
			&profilePicture, &result.OtherUser.IsVerified, &result.OtherUser.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning search result: %v", err)
			continue
		}

		result.ConversationID = result.Message.ConversationID

		if editedAt.Valid {
			result.Message.EditedAt = &editedAt.Time
		}
		if replyToMsgID.Valid {
			msgID := int(replyToMsgID.Int64)
			result.Message.ReplyToMessageID = &msgID
		}
		if displayName.Valid {
			result.OtherUser.DisplayName = displayName.String
		}
		if bio.Valid {
			result.OtherUser.Bio = bio.String
		}
		if profilePicture.Valid {
			result.OtherUser.ProfilePicture = profilePicture.String
		}

		results = append(results, result)
	}

	// Search in group messages
	groupRows, err := database.DB.Query(`
		SELECT gm.id, gm.group_id, gm.sender_id, gm.content, gm.status, gm.is_deleted,
		       gm.deleted_for_everyone, gm.is_edited, gm.edited_at, gm.reply_to_message_id, gm.created_at,
		       g.id, g.name, g.description, g.group_picture, g.created_by, g.created_at, g.updated_at
		FROM group_messages gm
		JOIN groups g ON gm.group_id = g.id
		JOIN group_members gm2 ON g.id = gm2.group_id
		WHERE gm2.user_id = ?
		AND gm.content LIKE ?
		AND gm.deleted_for_everyone = FALSE
		ORDER BY gm.created_at DESC
		LIMIT 50`,
		userID, searchPattern,
	)
	if err != nil {
		log.Printf("Error searching group messages: %v", err)
	} else {
		defer groupRows.Close()

		for groupRows.Next() {
			var result models.MessageSearchResult
			var groupMsg models.GroupMessage
			var group models.Group
			var editedAt sql.NullTime
			var replyToMsgID sql.NullInt64
			var description, groupPicture sql.NullString

			err := groupRows.Scan(
				&groupMsg.ID, &groupMsg.GroupID, &groupMsg.SenderID, &groupMsg.Content,
				&groupMsg.Status, &groupMsg.IsDeleted, &groupMsg.DeletedForEveryone,
				&groupMsg.IsEdited, &editedAt, &replyToMsgID, &groupMsg.CreatedAt,
				&group.ID, &group.Name, &description, &groupPicture, &group.CreatedBy,
				&group.CreatedAt, &group.UpdatedAt,
			)
			if err != nil {
				log.Printf("Error scanning group search result: %v", err)
				continue
			}

			// Convert GroupMessage to Message for the result
			result.Message = models.Message{
				ID:                 groupMsg.ID,
				SenderID:           groupMsg.SenderID,
				Content:            groupMsg.Content,
				Status:             groupMsg.Status,
				IsDeleted:          groupMsg.IsDeleted,
				DeletedForEveryone: groupMsg.DeletedForEveryone,
				IsEdited:           groupMsg.IsEdited,
				CreatedAt:          groupMsg.CreatedAt,
			}
			result.GroupID = groupMsg.GroupID

			if editedAt.Valid {
				result.Message.EditedAt = &editedAt.Time
			}
			if replyToMsgID.Valid {
				msgID := int(replyToMsgID.Int64)
				result.Message.ReplyToMessageID = &msgID
			}
			if description.Valid {
				group.Description = description.String
			}
			if groupPicture.Valid {
				group.GroupPicture = groupPicture.String
			}

			result.Group = &group
			results = append(results, result)
		}
	}

	if results == nil {
		results = []models.MessageSearchResult{}
	}

	RespondWithJSON(w, http.StatusOK, models.SearchMessagesResponse{Results: results})
}

// MuteConversation mutes or unmutes a conversation or group
func MuteConversation(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.MuteConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.ConversationID == 0 && req.GroupID == 0 {
		RespondWithError(w, http.StatusBadRequest, "Either conversation_id or group_id must be provided")
		return
	}

	if req.ConversationID != 0 && req.GroupID != 0 {
		RespondWithError(w, http.StatusBadRequest, "Cannot specify both conversation_id and group_id")
		return
	}

	if req.Mute {
		// Mute the conversation/group
		if req.ConversationID != 0 {
			// Verify user is part of conversation
			var exists bool
			err := database.DB.QueryRow(`
				SELECT EXISTS(
					SELECT 1 FROM conversations 
					WHERE id = ? AND (user1_id = ? OR user2_id = ?)
				)`, req.ConversationID, userID, userID,
			).Scan(&exists)

			if err != nil || !exists {
				RespondWithError(w, http.StatusForbidden, "Invalid conversation")
				return
			}

			_, err = database.DB.Exec(`
				INSERT OR IGNORE INTO muted_conversations (user_id, conversation_id) 
				VALUES (?, ?)`,
				userID, req.ConversationID,
			)
			if err != nil {
				log.Printf("Error muting conversation: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to mute conversation")
				return
			}
		} else {
			// Verify user is member of group
			var exists bool
			err := database.DB.QueryRow(`
				SELECT EXISTS(
					SELECT 1 FROM group_members 
					WHERE group_id = ? AND user_id = ?
				)`, req.GroupID, userID,
			).Scan(&exists)

			if err != nil || !exists {
				RespondWithError(w, http.StatusForbidden, "Invalid group")
				return
			}

			_, err = database.DB.Exec(`
				INSERT OR IGNORE INTO muted_conversations (user_id, group_id) 
				VALUES (?, ?)`,
				userID, req.GroupID,
			)
			if err != nil {
				log.Printf("Error muting group: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to mute group")
				return
			}
		}

		RespondWithJSON(w, http.StatusOK, models.SuccessResponse{Message: "Muted successfully"})
	} else {
		// Unmute the conversation/group
		if req.ConversationID != 0 {
			_, err := database.DB.Exec(`
				DELETE FROM muted_conversations 
				WHERE user_id = ? AND conversation_id = ?`,
				userID, req.ConversationID,
			)
			if err != nil {
				log.Printf("Error unmuting conversation: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to unmute conversation")
				return
			}
		} else {
			_, err := database.DB.Exec(`
				DELETE FROM muted_conversations 
				WHERE user_id = ? AND group_id = ?`,
				userID, req.GroupID,
			)
			if err != nil {
				log.Printf("Error unmuting group: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to unmute group")
				return
			}
		}

		RespondWithJSON(w, http.StatusOK, models.SuccessResponse{Message: "Unmuted successfully"})
	}
}
