package handlers

import (
	"encoding/json"
	"net/http"
)

type HealthResponse struct {
	Content string `json:"content"`
}

// HealthCheck handles health check requests
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{Content: "Backend is running!"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
