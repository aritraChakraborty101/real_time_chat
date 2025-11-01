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
