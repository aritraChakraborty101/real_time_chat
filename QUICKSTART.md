# Quick Start Guide

## UMA-01: User Registration Feature

This guide will help you quickly test the user registration, email verification, and login functionality.

## Start the Application

### Terminal 1 - Backend
```bash
cd backend
go run main.go
```

You should see:
```
2025/10/30 12:24:34 Database initialized successfully
2025/10/30 12:24:34 Server starting on :8080
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

The browser should automatically open to `http://localhost:3000`

## Test the Application

### Option 1: Using the Web Interface

1. **Register a New User**
   - Click "Sign Up" on the login page
   - Fill in:
     - Email: `yourname@example.com`
     - Username: `yourname`
     - Password: `password123` (minimum 8 characters)
     - Confirm Password: `password123`
   - Click "Sign Up"
   - You'll see: "Registration successful! Please check your email to verify your account."

2. **Verify Your Email**
   - Since SMTP is likely not configured, check the backend terminal
   - You'll see a log message like: `Verification link: http://localhost:3000/verify?token=abc123...`
   - Copy the verification link and paste it in your browser
   - OR get the token from the database:
     ```bash
     sqlite3 backend/chat.db "SELECT verification_token FROM users WHERE email='yourname@example.com';"
     ```
   - Then visit: `http://localhost:3000/verify?token=YOUR_TOKEN`
   - You'll see: "Email Verified!" and be redirected to login

3. **Login**
   - Enter your email and password
   - Click "Log In"
   - You'll be redirected to the dashboard showing your user info

4. **View Dashboard**
   - See your user information
   - Verified status should show a green checkmark
   - Click "Logout" to return to login page

### Option 2: Using the Test Script

Run the automated test script:
```bash
./test_auth.sh
```

This will test all functionality:
- ✓ User registration
- ✓ Duplicate email rejection
- ✓ Duplicate username rejection
- ✓ Login blocked before verification
- ✓ Email verification
- ✓ Successful login after verification
- ✓ Invalid credentials rejection

### Option 3: Using curl

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# 2. Get verification token
TOKEN=$(sqlite3 backend/chat.db "SELECT verification_token FROM users WHERE email='test@example.com';")

# 3. Verify email
curl "http://localhost:8080/api/auth/verify?token=$TOKEN"

# 4. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Testing Validation

### Test Email Uniqueness
Try registering with the same email twice - you should get:
```json
{"error":"Email already registered"}
```

### Test Username Uniqueness
Try registering with the same username twice - you should get:
```json
{"error":"Username already taken"}
```

### Test Unverified Login
Try logging in before verifying email - you should get:
```json
{"error":"Please verify your email before logging in"}
```

### Test Invalid Credentials
Try logging in with wrong password - you should get:
```json
{"error":"Invalid email or password"}
```

## Email Configuration (Optional)

To receive actual verification emails:

1. Edit `backend/.env`
2. For Gmail:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```
3. Get an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
   - Use that password in `.env`

4. Restart the backend server

## Database Inspection

View registered users:
```bash
sqlite3 backend/chat.db "SELECT id, email, username, is_verified, created_at FROM users;"
```

Reset the database:
```bash
rm backend/chat.db
# Restart backend - it will recreate the database
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Build Errors
```bash
cd backend
go mod tidy
go build
```

## What's Next?

Now that user registration is working, you can:

1. Add password reset functionality
2. Implement user profile management
3. Add WebSocket support for real-time chat
4. Create chat rooms
5. Add direct messaging
6. Implement message history
7. Add file upload functionality

## Acceptance Criteria Verification

✅ **AC1: Secure Sign Up with Password Hashing**
- Passwords are hashed with bcrypt
- Try viewing the database - passwords are encrypted
- Minimum 8 characters enforced

✅ **AC2: Email Verification**
- Users receive verification email (or link in logs)
- Cannot login before verification
- Verification status shown in dashboard

✅ **AC5: Unique Email/Username**
- Duplicate emails are rejected
- Duplicate usernames are rejected
- Database enforces uniqueness constraints

All acceptance criteria for UMA-01 are met! ✨
