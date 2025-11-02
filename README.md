# Real-Time Chat Application

A real-time chat application with a Go backend and React/TypeScript/Tailwind CSS frontend, featuring secure user authentication and email verification.

## Project Structure

```
real_time_chat/
├── backend/          # Go backend
│   ├── database/     # Database initialization and management
│   ├── handlers/     # HTTP request handlers
│   ├── models/       # Data models
│   ├── utils/        # Utility functions (auth, JWT, email)
│   ├── main.go       # Main server file
│   ├── go.mod        # Go module file
│   ├── .env          # Environment variables (not in git)
│   └── .env.example  # Environment variables template
└── frontend/         # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── services/    # API services
    │   ├── types/       # TypeScript types
    │   ├── App.tsx      # Main App component
    │   └── ...
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

## Tech Stack

### Backend
- **Go** - Backend server with HTTP handlers
- **SQLite** - Database for user data
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- Port: `8080`

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- Port: `3000` (default for React dev server)

## Features Implemented

### User Registration (UMA-01)
✅ **AC1: Secure Registration**
- Users can register with email, username, and password
- Passwords are securely hashed using bcrypt
- All fields are validated on both frontend and backend

✅ **AC2: Email Verification**
- Verification token generated upon registration
- Verification email sent to user's email address
- Users must verify email before logging in
- Email verification link with secure token

✅ **AC5: Unique Email/Username**
- Email uniqueness enforced at database level with unique constraint
- Username uniqueness enforced at database level with unique constraint
- Duplicate email/username attempts return appropriate error messages
- Database indexes on email and username for efficient lookups

### Additional Features
- **JWT-based Authentication** - Secure token-based auth
- **Login/Logout** - Complete authentication flow
- **User Dashboard** - Protected dashboard showing user information
- **Password Validation** - Minimum 8 characters
- **Username Validation** - 3-30 characters, alphanumeric with hyphens/underscores
- **Email Format Validation** - Standard email regex validation
- **CORS Enabled** - Cross-origin requests allowed for development

## Getting Started

### Prerequisites
- Go 1.24 or higher
- Node.js 18+ and npm
- SQLite3 (included with Go sqlite driver)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the following:
```env
JWT_SECRET=your-secret-key-change-this-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
APP_URL=http://localhost:3000
```

**Note:** For Gmail, you need to use an [App Password](https://support.google.com/accounts/answer/185833). If SMTP is not configured, verification links will be logged to console.

3. Install dependencies:
```bash
go mod download
```

4. Run the server:
```bash
go run main.go
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful! Please check your email to verify your account."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input, validation errors
- `409 Conflict` - Email or username already exists

#### Verify Email
```http
GET /api/auth/verify?token={verification_token}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully! You can now log in."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "is_verified": true,
    "created_at": "2025-10-30T06:25:36Z",
    "updated_at": "2025-10-30T06:25:36Z"
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Email not verified

#### Health Check
```http
GET /api/health
```

### Messaging Endpoints

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipient_id": 2,
  "content": "Hello, how are you?"
}
```

**Response (201 Created):**
```json
{
  "message": {
    "id": 1,
    "conversation_id": 1,
    "sender_id": 1,
    "content": "Hello, how are you?",
    "created_at": "2025-11-02T07:10:26Z"
  }
}
```

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "other_user": {
      "id": 2,
      "username": "johndoe",
      "display_name": "John Doe"
    },
    "last_message": {
      "content": "See you later!",
      "created_at": "2025-11-02T07:10:26Z"
    },
    "unread_count": 0,
    "updated_at": "2025-11-02T07:10:26Z"
  }
]
```

#### Get Messages
```http
GET /api/messages?friend_id=2
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "conversation_id": 1,
    "sender_id": 1,
    "content": "Hello!",
    "created_at": "2025-11-02T07:00:00Z"
  }
]
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_username` on `username`

### Conversations Table
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user1_id, user2_id),
    CHECK(user1_id < user2_id)
);
```

**Indexes:**
- `idx_conversations_user1` on `user1_id`
- `idx_conversations_user2` on `user2_id`

### Messages Table
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_messages_conversation` on `conversation_id`
- `idx_messages_sender` on `sender_id`
- `idx_messages_created_at` on `created_at`

## Security Features

1. **Password Hashing** - Bcrypt with default cost (10)
2. **JWT Tokens** - 24-hour expiration
3. **Email Verification** - Cryptographically secure tokens
4. **Input Validation** - Both frontend and backend
5. **SQL Injection Prevention** - Prepared statements
6. **CORS** - Configurable cross-origin access
7. **Unique Constraints** - Database-level email/username uniqueness

## Testing the Application

### Manual Testing Flow

1. **Register a new user:**
   - Navigate to `http://localhost:3000`
   - Click "Sign Up"
   - Fill in email, username, and password
   - Click "Sign Up"
   - Check console logs for verification link (if SMTP not configured)

2. **Verify email:**
   - Click the verification link from email or console
   - Should see success message

3. **Login:**
   - Return to login page
   - Enter email and password
   - Click "Log In"
   - Should redirect to dashboard

4. **View dashboard:**
   - See user information
   - Logout functionality available

### API Testing with curl

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Get verification token from database
sqlite3 backend/chat.db "SELECT verification_token FROM users WHERE email='test@example.com';"

# Verify email
curl "http://localhost:8080/api/auth/verify?token=YOUR_TOKEN_HERE"

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Development Notes

### Current Implementation
- ✅ User registration with validation
- ✅ Secure password hashing
- ✅ Email verification system
- ✅ Unique email/username constraints
- ✅ JWT-based authentication
- ✅ Login/logout functionality
- ✅ Protected dashboard
- ✅ SQLite database with proper schema
- ✅ User profile management
- ✅ Friend system (add, accept, remove)
- ✅ Password reset functionality
- ✅ **One-to-one messaging** (MSG-01)
  - Send and receive messages with friends
  - Conversation history
  - Message bubbles UI
  - Multiple conversation entry points

### Next Steps (To Be Implemented)
- WebSocket integration for real-time messaging
- Online/offline presence indicators
- Typing indicators
- Read receipts
- Group chat rooms
- File uploads and image sharing
- Message search
- Push notifications

## Troubleshooting

### Backend Issues

**Database locked error:**
```bash
rm backend/chat.db
# Restart backend to recreate database
```

**Port 8080 already in use:**
```bash
lsof -ti:8080 | xargs kill -9
```

### Frontend Issues

**Tailwind CSS not working:**
```bash
cd frontend
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

**React Router errors:**
```bash
cd frontend
npm install react-router-dom
```

## Environment Variables

### Backend (.env)
- `JWT_SECRET` - Secret key for JWT signing (required)
- `SMTP_HOST` - SMTP server host (optional)
- `SMTP_PORT` - SMTP server port (optional)
- `SMTP_USER` - SMTP username (optional)
- `SMTP_PASSWORD` - SMTP password (optional)
- `APP_URL` - Frontend URL for verification links (required)

## License

This project is for educational purposes.
