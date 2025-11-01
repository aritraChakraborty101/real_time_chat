# Password Management Feature - UMA-03

This document describes the implementation of the password management feature for the Real-Time Chat application.

## Overview

The password management feature allows users to:
1. Request a password reset link via email if they forget their password
2. Reset their password using a secure, time-limited token
3. Change their password from the settings page when logged in

## Architecture

### Backend Components

#### 1. Database Schema Updates (`backend/database/db.go`)
Added new fields to the `users` table:
- `reset_token`: Stores the password reset token
- `reset_token_expires`: Stores the expiration timestamp (1 hour from creation)

#### 2. Models (`backend/models/user.go`)
New request/response types:
- `ForgotPasswordRequest`: Email for password reset request
- `ResetPasswordRequest`: Token and new password for password reset
- `ChangePasswordRequest`: Current password and new password for password change

#### 3. Handlers (`backend/handlers/auth.go`)

**ForgotPassword Handler**
- Accepts email address
- Validates user exists and is verified
- Generates secure random token
- Stores token with 1-hour expiration
- Sends reset email (or logs link if SMTP not configured)
- Returns generic success message to prevent email enumeration

**ResetPassword Handler**
- Accepts reset token and new password
- Validates token exists and hasn't expired
- Validates new password strength
- Updates password and clears reset token
- Returns success message

**ChangePassword Handler** (Protected Route)
- Requires authentication (JWT token)
- Accepts current password and new password
- Verifies current password is correct
- Validates new password strength
- Updates password
- Returns success message

#### 4. Middleware (`backend/middleware/auth.go`)
New authentication middleware that:
- Extracts JWT token from Authorization header
- Validates token
- Adds user information to request context
- Protects the change-password endpoint

#### 5. Email Utility (`backend/utils/auth.go`)
Added `SendPasswordResetEmail` function that:
- Sends HTML email with reset link
- Falls back to console logging if SMTP not configured
- Includes 1-hour expiration notice

#### 6. Routes (`backend/routes/router.go`)
New endpoints:
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (protected)

### Frontend Components

#### 1. Services (`frontend/src/services/authService.ts`)
New service methods:
- `forgotPassword(email)`: Request password reset
- `resetPassword(token, newPassword)`: Reset password with token
- `changePassword(currentPassword, newPassword)`: Change password for logged-in user

#### 2. Types (`frontend/src/types/auth.ts`)
New TypeScript interfaces:
- `ForgotPasswordRequest`
- `ResetPasswordRequest`
- `ChangePasswordRequest`

#### 3. Components

**ForgotPassword Component** (`frontend/src/components/ForgotPassword.tsx`)
- Email input form
- Displays success/error messages
- "Back to Login" link
- Responsive design with dark mode support

**ResetPassword Component** (`frontend/src/components/ResetPassword.tsx`)
- Extracts token from URL query parameter
- New password and confirm password fields
- Password validation
- Auto-redirects to login after successful reset
- Responsive design with dark mode support

**ChangePassword Component** (`frontend/src/components/ChangePassword.tsx`)
- Current password field
- New password and confirm password fields
- Password validation
- Can be used as modal or standalone page
- Optional onClose callback for modal usage
- Responsive design with dark mode support

**Updated Login Component** (`frontend/src/components/Login.tsx`)
- Added "Forgot password?" link
- Links to ForgotPassword component

**Updated Dashboard Component** (`frontend/src/components/Dashboard.tsx`)
- Added "Settings" button in navigation
- Opens ChangePassword modal when clicked
- Modal overlay with centered form

#### 4. Routing (`frontend/src/App.tsx`)
New routes:
- `/reset-password` - Password reset page
- Integrated ForgotPassword into home page flow

## Security Features

### Token Security
1. **Cryptographically Secure Tokens**: Uses `crypto/rand` to generate 32-byte random tokens
2. **Time-Limited**: Reset tokens expire after 1 hour
3. **Single-Use**: Tokens are cleared from database after successful password reset
4. **Unpredictable**: 64-character hexadecimal tokens (256-bit entropy)

### Password Security
1. **Bcrypt Hashing**: All passwords hashed using bcrypt with default cost
2. **Password Validation**: Minimum 8 characters required
3. **Current Password Verification**: Change password requires current password
4. **No Password Reuse Prevention**: New password must differ from current

### API Security
1. **JWT Authentication**: Change password endpoint requires valid JWT token
2. **Rate Limiting Ready**: Structure supports rate limiting implementation
3. **Email Enumeration Prevention**: Forgot password always returns success
4. **HTTPS Ready**: Designed for secure transport layer

### Authorization
1. **User-Specific Operations**: Users can only change their own password
2. **Verified Accounts Only**: Only verified users can request password reset
3. **Token Validation**: All operations validate token ownership

## User Flows

### 1. Forgot Password Flow
```
User → Login Page → "Forgot Password" Link → ForgotPassword Component
  → Enter Email → Submit → Success Message
  → Email Sent (with reset link)
  → Click Link → ResetPassword Page
  → Enter New Password → Submit → Success
  → Auto-redirect to Login
```

### 2. Change Password Flow (Logged In)
```
User → Dashboard → "Settings" Button → ChangePassword Modal
  → Enter Current Password → Enter New Password → Confirm Password
  → Submit → Success Message → Modal Auto-closes
```

## Testing

### Automated Testing
Run the test script:
```bash
# Start backend server first
cd backend
./main

# In another terminal, run tests
./test_password_management.sh
```

### Manual Testing

#### Test Forgot Password
1. Start backend: `cd backend && ./main`
2. Start frontend: `cd frontend && npm start`
3. Click "Forgot password?" on login page
4. Enter registered email
5. Check backend logs for reset link
6. Copy token from logs
7. Navigate to `/reset-password?token=<TOKEN>`
8. Enter new password and submit
9. Login with new password

#### Test Change Password
1. Login to application
2. Click "Settings" button in dashboard
3. Enter current password
4. Enter and confirm new password
5. Submit form
6. Logout and login with new password

#### Test Error Cases
1. **Invalid Email**: Should show error on forgot password
2. **Expired Token**: Should show "Invalid or expired token"
3. **Wrong Current Password**: Should show "Current password is incorrect"
4. **Weak Password**: Should show "Password must be at least 8 characters"
5. **Password Mismatch**: Should show "Passwords do not match"

## API Endpoints

### POST /api/auth/forgot-password
Request password reset link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Reset password using token.

**Request:**
```json
{
  "token": "abc123...",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully! You can now log in with your new password."
}
```

**Error (400):**
```json
{
  "error": "Invalid or expired reset token"
}
```

### POST /api/auth/change-password
Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully!"
}
```

**Error (401):**
```json
{
  "error": "Current password is incorrect"
}
```

## Environment Configuration

No additional environment variables required. Uses existing SMTP configuration:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `APP_URL`: Application URL for reset links

## Database Migrations

The database schema is automatically updated when the application starts. The new fields are:
- `reset_token TEXT`: Nullable, stores password reset token
- `reset_token_expires DATETIME`: Nullable, stores token expiration time

An index is created on `reset_token` for performance:
```sql
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
```

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Password History**: Prevent reuse of recent passwords
3. **Password Strength Meter**: Visual feedback on password strength
4. **2FA Integration**: Add two-factor authentication
5. **Session Invalidation**: Invalidate all sessions on password change
6. **Email Templates**: Use HTML email templates
7. **Audit Logging**: Log all password change events
8. **Account Recovery**: Alternative recovery methods (security questions, SMS)

## Acceptance Criteria Status

✅ **AC1**: User can request a password reset link via their registered email
- Implemented via ForgotPassword component and forgot-password endpoint
- Email sent with reset link (or logged if SMTP not configured)

✅ **AC2**: The reset link is unique, secure, and time-limited
- 64-character cryptographically random token (256-bit entropy)
- Expires after 1 hour
- Stored securely in database with expiration timestamp
- Single-use (cleared after successful reset)

✅ **AC3**: A logged-in user can change their current password from the settings page
- Implemented via ChangePassword component
- Accessible from Dashboard "Settings" button
- Requires current password verification
- Protected by JWT authentication
