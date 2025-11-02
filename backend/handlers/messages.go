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

	var req models.SendMessageRequest
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

	// Insert message
	result, err := database.DB.Exec(`
		INSERT INTO messages (conversation_id, sender_id, content)
		VALUES (?, ?, ?)`,
		conversationID, userID, req.Content,
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
	err = database.DB.QueryRow(`
		SELECT id, conversation_id, sender_id, content, created_at
		FROM messages WHERE id = ?`,
		messageID,
	).Scan(&message.ID, &message.ConversationID, &message.SenderID, &message.Content, &message.CreatedAt)

	if err != nil {
		log.Printf("Error fetching message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
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
			m.id, m.conversation_id, m.sender_id, m.content, m.created_at
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
		WHERE c.user1_id = ? OR c.user2_id = ?
		ORDER BY c.updated_at DESC`,
		userID, userID, userID, userID,
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
		var msgContent sql.NullString
		var msgCreatedAt sql.NullTime

		err := rows.Scan(
			&conv.ID, &conv.OtherUser.ID, &conv.OtherUser.ID, &conv.UpdatedAt,
			&conv.OtherUser.ID, &conv.OtherUser.Username, &displayName, &bio, &profilePicture,
			&conv.OtherUser.IsVerified, &conv.OtherUser.CreatedAt,
			&msgID, &msgConvID, &msgSenderID, &msgContent, &msgCreatedAt,
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
				CreatedAt:      msgCreatedAt.Time,
			}
		}

		conv.UnreadCount = 0 // TODO: Implement unread count

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
		SELECT id, conversation_id, sender_id, content, created_at
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
		err := rows.Scan(&message.ID, &message.ConversationID, &message.SenderID, &message.Content, &message.CreatedAt)
		if err != nil {
			log.Printf("Error scanning message: %v", err)
			continue
		}
		messages = append(messages, message)
	}

	if messages == nil {
		messages = []models.Message{}
	}

	RespondWithJSON(w, http.StatusOK, messages)
}
