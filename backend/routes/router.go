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
	
	// Protected endpoints (require authentication)
	http.HandleFunc("/api/auth/change-password", middleware.CORSMiddleware(middleware.AuthMiddleware(handlers.ChangePassword)))
}
