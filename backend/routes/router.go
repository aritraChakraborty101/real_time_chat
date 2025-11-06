package routes

import (
	"net/http"
	
	"real-time-chat/handlers"
	"real-time-chat/middleware"
)

// SetupRoutes configures all application routes
func SetupRoutes() {
	// Health check endpoint
	http.HandleFunc("/api/health", middleware.CORSMiddleware(handlers.HealthCheck))
	
	// Auth endpoints (public)
	http.HandleFunc("/api/auth/register", middleware.CORSMiddleware(handlers.Register))
	http.HandleFunc("/api/auth/login", middleware.CORSMiddleware(handlers.Login))
	http.HandleFunc("/api/auth/verify", middleware.CORSMiddleware(handlers.VerifyEmail))
	http.HandleFunc("/api/auth/forgot-password", middleware.CORSMiddleware(handlers.ForgotPassword))
	http.HandleFunc("/api/auth/reset-password", middleware.CORSMiddleware(handlers.ResetPassword))
	
	// Profile endpoints (protected)
	http.HandleFunc("/api/profile/me", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetMyProfile)))
	http.HandleFunc("/api/profile/update", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.UpdateProfile)))
	http.HandleFunc("/api/profile/upload-picture", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.UploadProfilePicture)))
	http.HandleFunc("/api/profile/user", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetUserProfile)))
	http.HandleFunc("/api/profile/search", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SearchUsers)))
	
	// Privacy settings endpoints (protected)
	http.HandleFunc("/api/privacy/settings", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetPrivacySettings)))
	http.HandleFunc("/api/privacy/update", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.UpdatePrivacySettings)))
	
	// Friend endpoints (protected)
	http.HandleFunc("/api/friends", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetFriends)))
	http.HandleFunc("/api/friends/requests", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetFriendRequests)))
	http.HandleFunc("/api/friends/send", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SendFriendRequest)))
	http.HandleFunc("/api/friends/respond", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.RespondToFriendRequest)))
	http.HandleFunc("/api/friends/remove", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.RemoveFriend)))
	
	// Message endpoints (protected)
	http.HandleFunc("/api/messages/send", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SendMessage)))
	http.HandleFunc("/api/messages/conversations", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetConversations)))
	http.HandleFunc("/api/messages", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetMessages)))
	http.HandleFunc("/api/messages/update-status", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.UpdateMessageStatus)))
	http.HandleFunc("/api/messages/mark-read", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.MarkConversationAsRead)))
	http.HandleFunc("/api/messages/typing", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.UpdateTypingStatus)))
	http.HandleFunc("/api/messages/typing-status", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetTypingStatus)))
	http.HandleFunc("/api/messages/delete", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.DeleteMessage)))
	http.HandleFunc("/api/messages/edit", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.EditMessage)))
	http.HandleFunc("/api/messages/search", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SearchMessages)))
	http.HandleFunc("/api/messages/mute", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.MuteConversation)))
	
	// Group endpoints (protected)
	http.HandleFunc("/api/groups/create", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.CreateGroup)))
	http.HandleFunc("/api/groups", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetUserGroups)))
	http.HandleFunc("/api/groups/details", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetGroupDetails)))
	http.HandleFunc("/api/groups/add-member", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.AddGroupMember)))
	http.HandleFunc("/api/groups/leave", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.LeaveGroup)))
	http.HandleFunc("/api/groups/remove-member", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.RemoveGroupMember)))
	http.HandleFunc("/api/groups/send-message", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SendGroupMessage)))
	http.HandleFunc("/api/groups/messages", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetGroupMessages)))
	
	// Password management (protected)
	http.HandleFunc("/api/auth/change-password", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.ChangePassword)))
}
