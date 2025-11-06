# Real-Time Chat Application

A fully-featured real-time chat application with a Go backend and React/TypeScript/Tailwind CSS frontend. Features include secure authentication, user profiles, friend management, one-to-one messaging, group chats, and comprehensive privacy controls.

## 🚀 Project Status

**Current Version:** Beta v1.0  
**Last Updated:** November 2025

### ✅ Core Features Complete
- User authentication & email verification
- User profiles & customization
- Friend/connection management  
- One-to-one messaging with rich features (edit, delete, reply)
- Group chats with member management
- Privacy settings & user blocking
- Responsive design with dark mode
- Real-time chat feedback (typing indicators, read receipts)

### 🔄 In Development
- WebSocket integration for instant messaging
- File/image sharing
- Voice/video calls
- End-to-end encryption

## Project Structure

```
real_time_chat/
├── backend/              # Go backend
│   ├── database/         # Database initialization and schema
│   │   └── db.go
│   ├── handlers/         # HTTP request handlers
│   │   ├── auth.go       # Authentication endpoints
│   │   ├── profile.go    # Profile management
│   │   ├── friends.go    # Friend system
│   │   ├── messages.go   # Messaging endpoints
│   │   ├── groups.go     # Group chat
│   │   ├── privacy.go    # Privacy settings
│   │   └── health.go     # Health check
│   ├── middleware/       # HTTP middleware
│   │   ├── auth.go       # JWT authentication
│   │   └── cors.go       # CORS configuration
│   ├── models/           # Data models
│   │   └── user.go       # User and related models
│   ├── routes/           # Route definitions
│   │   └── router.go
│   ├── utils/            # Utility functions
│   │   ├── auth.go       # Auth helpers, email
│   │   └── jwt.go        # JWT utilities
│   ├── main.go           # Main server file
│   ├── go.mod            # Go module file
│   ├── .env              # Environment variables (not in git)
│   ├── .env.example      # Environment template
│   └── chat.db           # SQLite database (generated)
│
└── frontend/             # React frontend
    ├── public/           # Static assets
    ├── src/
    │   ├── components/   # React components
    │   │   ├── Register.tsx
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── SettingsPanel.tsx
    │   │   ├── EditProfile.tsx
    │   │   ├── UserProfileView.tsx
    │   │   ├── FriendsList.tsx
    │   │   ├── FriendRequests.tsx
    │   │   ├── UserSearch.tsx
    │   │   ├── ConversationsList.tsx
    │   │   ├── ChatInterface.tsx
    │   │   ├── GroupsList.tsx
    │   │   ├── GroupChat.tsx
    │   │   ├── PrivacySettings.tsx
    │   │   ├── ChangePassword.tsx
    │   │   ├── ForgotPassword.tsx
    │   │   ├── ResetPassword.tsx
    │   │   └── VerifyEmail.tsx
    │   ├── contexts/     # React contexts
    │   │   ├── ThemeContext.tsx
    │   │   └── UserProfileContext.tsx
    │   ├── services/     # API services
    │   │   ├── authService.ts
    │   │   └── profileService.ts
    │   ├── types/        # TypeScript types
    │   │   └── auth.ts
    │   ├── App.tsx       # Main app component
    │   └── index.tsx     # Entry point
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

### 🔐 Authentication & Security
- ✅ **User Registration (UMA-01)** - Secure registration with email/username/password
- ✅ **Email Verification** - Token-based email verification before login
- ✅ **JWT Authentication** - Secure token-based auth with 24-hour expiration
- ✅ **Password Management (UMA-03)** - Forgot password, reset password, change password
- ✅ **Bcrypt Password Hashing** - Industry-standard password security
- ✅ **Unique Constraints** - Database-level email/username uniqueness

### 👤 User Profile Management (UMP-01, UMP-02)
- ✅ **Profile Creation & Editing** - Display name, bio, profile picture
- ✅ **Profile Pictures** - Image upload with base64 storage (max 2MB)
- ✅ **User Profiles** - View other users' profiles with verification badges
- ✅ **Username System** - Unique, permanent usernames with @ prefix
- ✅ **User Search** - Real-time search by username or display name

### 👥 Connection Management (UMC-01 to UMC-04)
- ✅ **User Search** - Debounced search with real-time results
- ✅ **Friend Requests** - Send, accept, decline, and cancel friend requests
- ✅ **Friend List** - View all connected friends with profile links
- ✅ **Remove Friends** - Manage connections with confirmation dialogs
- ✅ **Request Notifications** - Badge counts for pending requests

### 💬 Messaging Features (MSG-01, MSG-02+)
- ✅ **One-to-One Messaging** - Direct messaging between friends
- ✅ **Conversation Management** - List of all conversations with previews
- ✅ **Message History** - Full conversation history with timestamps
- ✅ **Message Editing** - Edit sent messages with edit indicators
- ✅ **Message Deletion** - Delete messages with confirmation
- ✅ **Message Reply** - Reply to specific messages with context
- ✅ **Real-time Feedback** - Typing indicators and read receipts
- ✅ **Message Bubbles** - Distinct UI for sent/received messages

### 👪 Group Chat Features
- ✅ **Group Creation** - Create groups with name and description
- ✅ **Group Messaging** - Send messages in group conversations
- ✅ **Group Management** - Add/remove members, leave groups
- ✅ **Group Member List** - View all group participants
- ✅ **Group Settings** - Edit group name and description

### 🔇 Privacy & Controls
- ✅ **Mute Conversations** - Mute individual conversations and groups
- ✅ **Privacy Settings** - Manage who can contact you
- ✅ **Block Users** - Block and unblock users
- ✅ **Profile Visibility** - Control profile information visibility

### 🎨 User Interface
- ✅ **Responsive Design** - Mobile, tablet, and desktop support
- ✅ **Dark Mode** - Full dark mode support with theme toggle
- ✅ **Modern Dashboard** - Navbar, collapsible sidebar, settings panel
- ✅ **Chat Interface** - Dedicated chat route with message management
- ✅ **Modal Overlays** - Profile views, settings, confirmations
- ✅ **Loading States** - Visual feedback for all async operations

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

#### Verify Email
```http
GET /api/auth/verify?token={verification_token}
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

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "new_password": "newpassword123"
}
```

#### Change Password (Protected)
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

### Profile Endpoints (Protected)

#### Get My Profile
```http
GET /api/profile/me
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/profile/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "display_name": "John Doe",
  "bio": "Software developer"
}
```

#### Upload Profile Picture
```http
POST /api/profile/upload-picture
Authorization: Bearer {token}
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}
```

#### Search Users
```http
GET /api/profile/search?q={query}
Authorization: Bearer {token}
```

### Friend Endpoints (Protected)

#### Send Friend Request
```http
POST /api/friends/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_id": 2
}
```

#### Respond to Friend Request
```http
POST /api/friends/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_id": 2,
  "action": "accept"
}
```

#### Get Friend Requests
```http
GET /api/friends/requests
Authorization: Bearer {token}
```

#### Get Friends List
```http
GET /api/friends
Authorization: Bearer {token}
```

#### Remove Friend
```http
DELETE /api/friends/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_id": 2
}
```

### Messaging Endpoints (Protected)

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

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer {token}
```

#### Get Messages
```http
GET /api/messages?friend_id={friend_id}
Authorization: Bearer {token}
```

#### Edit Message
```http
PUT /api/messages/{message_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated message content"
}
```

#### Delete Message
```http
DELETE /api/messages/{message_id}
Authorization: Bearer {token}
```

#### Mark Messages as Read
```http
POST /api/messages/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "conversation_id": 1
}
```

### Group Endpoints (Protected)

#### Create Group
```http
POST /api/groups/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Study Group",
  "description": "Group for study materials"
}
```

#### Get Groups
```http
GET /api/groups
Authorization: Bearer {token}
```

#### Get Group Messages
```http
GET /api/groups/{group_id}/messages
Authorization: Bearer {token}
```

#### Send Group Message
```http
POST /api/groups/{group_id}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello everyone!"
}
```

#### Add Group Member
```http
POST /api/groups/{group_id}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 2
}
```

#### Leave Group
```http
DELETE /api/groups/{group_id}/leave
Authorization: Bearer {token}
```

### Privacy Endpoints (Protected)

#### Get Privacy Settings
```http
GET /api/privacy/settings
Authorization: Bearer {token}
```

#### Update Privacy Settings
```http
PUT /api/privacy/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "who_can_message_me": "friends",
  "who_can_see_my_profile": "everyone"
}
```

#### Block User
```http
POST /api/privacy/block
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 2
}
```

#### Unblock User
```http
DELETE /api/privacy/unblock/{user_id}
Authorization: Bearer {token}
```

#### Health Check
```http
GET /api/health
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    profile_picture TEXT,
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_username` on `username`
- `idx_users_reset_token` on `reset_token`

### Friendships Table
```sql
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'blocked')),
    requested_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);
```

**Indexes:**
- `idx_friendships_user_id` on `user_id`
- `idx_friendships_friend_id` on `friend_id`
- `idx_friendships_status` on `status`

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
    is_edited BOOLEAN DEFAULT FALSE,
    reply_to_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);
```

**Indexes:**
- `idx_messages_conversation` on `conversation_id`
- `idx_messages_sender` on `sender_id`
- `idx_messages_created_at` on `created_at`

### Groups Table
```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

### Group Members Table
```sql
CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);
```

### Group Messages Table
```sql
CREATE TABLE group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    reply_to_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES group_messages(id) ON DELETE SET NULL
);
```

### Privacy Settings Table
```sql
CREATE TABLE privacy_settings (
    user_id INTEGER PRIMARY KEY,
    who_can_message_me TEXT DEFAULT 'everyone' CHECK(who_can_message_me IN ('everyone', 'friends', 'nobody')),
    who_can_see_my_profile TEXT DEFAULT 'everyone' CHECK(who_can_see_my_profile IN ('everyone', 'friends', 'nobody')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Blocked Users Table
```sql
CREATE TABLE blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(blocker_id, blocked_id)
);
```

### Muted Conversations Table
```sql
CREATE TABLE muted_conversations (
    user_id INTEGER NOT NULL,
    conversation_id INTEGER NOT NULL,
    muted_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, conversation_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

### Read Receipts Table
```sql
CREATE TABLE read_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    UNIQUE(user_id, message_id)
);
```

## Security Features

1. **Password Security**
   - Bcrypt hashing with cost factor 10
   - Minimum 8 character requirement
   - Secure password reset with time-limited tokens
   - Current password verification for changes

2. **Authentication**
   - JWT tokens with 24-hour expiration
   - Bearer token authentication
   - Protected routes and endpoints
   - Email verification required

3. **Token Security**
   - Cryptographically secure random tokens (256-bit)
   - Time-limited reset tokens (1 hour)
   - Single-use verification tokens
   - Database-indexed for fast lookup

4. **Privacy Controls**
   - User blocking functionality
   - Privacy settings (who can message/see profile)
   - Mute conversations
   - Profile visibility controls

5. **Database Security**
   - SQL injection prevention with prepared statements
   - Unique constraints on email/username
   - Foreign key constraints for data integrity
   - Cascading deletes for cleanup

6. **API Security**
   - CORS configuration
   - Request validation
   - Error message sanitization
   - Rate limiting ready structure

## Testing the Application

### Quick Start Testing

1. **Register and verify a new user:**
   - Navigate to `http://localhost:3000`
   - Click "Sign Up"
   - Fill in email, username, and password
   - Check console logs for verification link (if SMTP not configured)
   - Click verification link
   - Login with credentials

2. **Set up profile:**
   - Click on user avatar → Settings
   - Click "Edit Profile"
   - Add display name, bio, and profile picture
   - Save changes

3. **Connect with friends:**
   - Use search bar to find users
   - Click on user profile
   - Send friend request
   - Other user accepts request
   - View in Friends list

4. **Start messaging:**
   - Click "Messages" in sidebar
   - Or click chat icon next to friend name
   - Send messages, edit, delete, reply
   - View typing indicators and read receipts

5. **Create a group:**
   - Click "Groups" in sidebar
   - Click "Create Group"
   - Add name and description
   - Add members from friends list
   - Start group conversation

6. **Manage privacy:**
   - Go to Settings → Privacy & Security
   - Configure who can message you
   - Configure profile visibility
   - Block/unblock users
   - Mute conversations

### API Testing with curl

See individual documentation files for detailed API examples:
- `QUICKSTART_PASSWORD.md` - Password management testing
- `QUICKSTART_MESSAGING.md` - Messaging feature testing
- `test_auth.sh` - Authentication flow testing
- `test_password_management.sh` - Password reset testing

## Development Notes

### Current Implementation Status

#### ✅ Completed Features
- User authentication (registration, login, email verification)
- Password management (forgot, reset, change)
- User profiles (create, edit, view, search)
- Friend system (add, accept, decline, remove)
- One-to-one messaging (send, receive, edit, delete, reply)
- Group chats (create, manage, message)
- Real-time feedback (typing indicators, read receipts)
- Privacy controls (block users, privacy settings, mute)
- Responsive UI (mobile, tablet, desktop)
- Dark mode theme toggle
- Modern dashboard layout

#### 🚧 In Progress / Future Enhancements
- WebSocket integration for real-time messaging
- Push notifications
- File uploads and image sharing in messages
- Voice/video calls
- Message search functionality
- End-to-end encryption
- Message reactions/emojis
- User presence (online/offline/away)
- Advanced group permissions
- Message pinning
- Conversation archiving
- Multi-device support
- Mobile apps (React Native)

### Documentation

- `README.md` - This file, main project documentation
- `IMPLEMENTATION.md` - Detailed implementation of UMA-01
- `PASSWORD_MANAGEMENT.md` - Password features documentation
- `USER_PROFILE_MANAGEMENT.md` - Profile features (UMP-01, UMP-02)
- `CONNECTION_MANAGEMENT.md` - Friend system (UMC-01 to UMC-04)
- `QUICKSTART_MESSAGING.md` - Messaging quick start guide
- `RESPONSIVE_LAYOUT.md` - UI/UX documentation
- `LAYOUT_FEATURES.md` - Dashboard layout details
- `CHANGES.md` - Complete change log
- `UMA-03-SUMMARY.md` - Password management summary

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
Required variables:
- `JWT_SECRET` - Secret key for JWT signing (required)
- `APP_URL` - Frontend URL for verification links (required, default: http://localhost:3000)

Optional SMTP variables (for email delivery):
- `SMTP_HOST` - SMTP server host (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (e.g., 587)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password or app password

**Note:** If SMTP is not configured, verification and reset links will be logged to the console.

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

## License

This project is for educational purposes.
