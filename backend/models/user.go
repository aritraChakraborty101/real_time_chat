package models

import (
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	DisplayName string  `json:"display_name,omitempty"`
	Bio       string    `json:"bio,omitempty"`
	ProfilePicture string `json:"profile_picture,omitempty"`
	Password  string    `json:"-"` // Never include password in JSON responses
	IsVerified bool     `json:"is_verified"`
	VerificationToken string `json:"-"`
	ResetToken string `json:"-"`
	ResetTokenExpires *time.Time `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserProfile struct {
	ID             int       `json:"id"`
	Username       string    `json:"username"`
	DisplayName    string    `json:"display_name,omitempty"`
	Bio            string    `json:"bio,omitempty"`
	ProfilePicture string    `json:"profile_picture,omitempty"`
	IsVerified     bool      `json:"is_verified"`
	CreatedAt      time.Time `json:"created_at"`
	FriendStatus   string    `json:"friend_status,omitempty"` // "friend", "pending", "none", "blocked"
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateProfileRequest struct {
	DisplayName string `json:"display_name"`
	Bio         string `json:"bio"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type FriendRequest struct {
	FriendID int `json:"friend_id"`
}

type FriendRequestResponse struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	FriendID  int       `json:"friend_id"`
	Status    string    `json:"status"`
	Friend    UserProfile `json:"friend"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	Token   string `json:"token"`
	User    User   `json:"user"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

type ProfileResponse struct {
	Profile UserProfile `json:"profile"`
	Message string      `json:"message,omitempty"`
}

type Message struct {
	ID             int       `json:"id"`
	ConversationID int       `json:"conversation_id"`
	SenderID       int       `json:"sender_id"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

type Conversation struct {
	ID        int       `json:"id"`
	User1ID   int       `json:"user1_id"`
	User2ID   int       `json:"user2_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ConversationWithUser struct {
	ID             int         `json:"id"`
	OtherUser      UserProfile `json:"other_user"`
	LastMessage    *Message    `json:"last_message,omitempty"`
	UnreadCount    int         `json:"unread_count"`
	UpdatedAt      time.Time   `json:"updated_at"`
}

type SendMessageRequest struct {
	RecipientID int    `json:"recipient_id"`
	Content     string `json:"content"`
}

type MessageResponse struct {
	Message Message `json:"message"`
}

type Group struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	GroupPicture string    `json:"group_picture,omitempty"`
	CreatedBy    int       `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type GroupMember struct {
	ID       int       `json:"id"`
	GroupID  int       `json:"group_id"`
	UserID   int       `json:"user_id"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

type GroupMemberWithUser struct {
	ID       int         `json:"id"`
	GroupID  int         `json:"group_id"`
	User     UserProfile `json:"user"`
	Role     string      `json:"role"`
	JoinedAt time.Time   `json:"joined_at"`
}

type GroupMessage struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	SenderID  int       `json:"sender_id"`
	Sender    *UserProfile `json:"sender,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type GroupWithDetails struct {
	ID           int                   `json:"id"`
	Name         string                `json:"name"`
	Description  string                `json:"description,omitempty"`
	GroupPicture string                `json:"group_picture,omitempty"`
	CreatedBy    int                   `json:"created_by"`
	MemberCount  int                   `json:"member_count"`
	Members      []GroupMemberWithUser `json:"members,omitempty"`
	LastMessage  *GroupMessage         `json:"last_message,omitempty"`
	UserRole     string                `json:"user_role,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
}

type CreateGroupRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	GroupPicture string `json:"group_picture"`
	MemberIDs    []int  `json:"member_ids"`
}

type AddGroupMemberRequest struct {
	UserID int `json:"user_id"`
}

type UpdateGroupRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	GroupPicture string `json:"group_picture"`
}

type SendGroupMessageRequest struct {
	Content string `json:"content"`
}

type GroupMessageResponse struct {
	Message GroupMessage `json:"message"`
}
