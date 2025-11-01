package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword generates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateVerificationToken creates a random token for email verification
func GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ValidateEmail checks if email format is valid
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// ValidatePassword checks if password meets requirements
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}
	return nil
}

// ValidateUsername checks if username meets requirements
func ValidateUsername(username string) error {
	if len(username) < 3 {
		return fmt.Errorf("username must be at least 3 characters long")
	}
	if len(username) > 30 {
		return fmt.Errorf("username must be less than 30 characters")
	}
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	if !usernameRegex.MatchString(username) {
		return fmt.Errorf("username can only contain letters, numbers, underscores, and hyphens")
	}
	return nil
}

// SendVerificationEmail sends an email with verification link
func SendVerificationEmail(email, token string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	appURL := os.Getenv("APP_URL")

	// Skip sending email if SMTP is not configured
	if smtpHost == "" || smtpUser == "" || smtpPassword == "" {
		log.Printf("SMTP not configured. Verification link: %s/verify?token=%s", appURL, token)
		return nil
	}

	from := smtpUser
	to := []string{email}
	
	verificationLink := fmt.Sprintf("%s/verify?token=%s", appURL, token)
	
	subject := "Subject: Verify your email address\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Welcome to Real-Time Chat!</h2>
			<p>Please click the link below to verify your email address:</p>
			<a href="%s">Verify Email</a>
			<p>Or copy and paste this link in your browser:</p>
			<p>%s</p>
			<p>This link will expire in 24 hours.</p>
		</body>
		</html>
	`, verificationLink, verificationLink)

	message := []byte(subject + mime + body)

	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := smtp.SendMail(addr, auth, from, to, message)
	if err != nil {
		log.Printf("Failed to send email: %v. Verification link: %s", err, verificationLink)
		return err
	}

	log.Printf("Verification email sent to %s", email)
	return nil
}

// SendPasswordResetEmail sends an email with password reset link
func SendPasswordResetEmail(email, token string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	appURL := os.Getenv("APP_URL")

	// Skip sending email if SMTP is not configured
	if smtpHost == "" || smtpUser == "" || smtpPassword == "" {
		log.Printf("SMTP not configured. Password reset link: %s/reset-password?token=%s", appURL, token)
		return nil
	}

	from := smtpUser
	to := []string{email}
	
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", appURL, token)
	
	subject := "Subject: Reset your password\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Password Reset Request</h2>
			<p>You requested to reset your password. Click the link below to reset it:</p>
			<a href="%s">Reset Password</a>
			<p>Or copy and paste this link in your browser:</p>
			<p>%s</p>
			<p>This link will expire in 1 hour.</p>
			<p>If you didn't request this, please ignore this email.</p>
		</body>
		</html>
	`, resetLink, resetLink)

	message := []byte(subject + mime + body)

	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := smtp.SendMail(addr, auth, from, to, message)
	if err != nil {
		log.Printf("Failed to send email: %v. Password reset link: %s", err, resetLink)
		return err
	}

	log.Printf("Password reset email sent to %s", email)
	return nil
}
