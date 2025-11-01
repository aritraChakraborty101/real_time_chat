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
	
	// Friend endpoints (protected)
	http.HandleFunc("/api/friends", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetFriends)))
	http.HandleFunc("/api/friends/requests", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.GetFriendRequests)))
	http.HandleFunc("/api/friends/send", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.SendFriendRequest)))
	http.HandleFunc("/api/friends/respond", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.RespondToFriendRequest)))
	http.HandleFunc("/api/friends/remove", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.RemoveFriend)))
	
	// Password management (protected)
	http.HandleFunc("/api/auth/change-password", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.ChangePassword)))
}
