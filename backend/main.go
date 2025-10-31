package main

import (
	"encoding/json"
	"log"
	"net/http"

	"real-time-chat/database"
	"real-time-chat/handlers"

	"github.com/joho/godotenv"
)

type Message struct {
	Content string `json:"content"`
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	response := Message{Content: "Backend is running!"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.CloseDB()

	// Health check endpoint
	http.HandleFunc("/api/health", healthHandler)
	
	// Auth endpoints
	http.HandleFunc("/api/auth/register", handlers.Register)
	http.HandleFunc("/api/auth/login", handlers.Login)
	http.HandleFunc("/api/auth/verify", handlers.VerifyEmail)
	
	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
