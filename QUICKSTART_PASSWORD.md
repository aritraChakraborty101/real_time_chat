# Quick Start Guide - Password Management

## Prerequisites
- Backend server running on port 8080
- Frontend server running on port 3000
- At least one verified user account

## Feature Overview

### 1. Forgot Password (Public)
**Access**: Click "Forgot password?" link on login page

**Flow**:
1. Enter your registered email address
2. Click "Send Reset Link"
3. Check your email (or backend logs if SMTP not configured)
4. Click the reset link or visit `/reset-password?token=<YOUR_TOKEN>`
5. Enter new password (min 8 characters)
6. Confirm new password
7. Submit - you'll be redirected to login
8. Login with new password

**Email Example**:
```
Subject: Reset your password

You requested to reset your password. Click the link below to reset it:
http://localhost:3000/reset-password?token=abc123...

This link will expire in 1 hour.
If you didn't request this, please ignore this email.
```

### 2. Change Password (Authenticated)
**Access**: Login → Click "Settings" button in Dashboard

**Flow**:
1. Modal opens with change password form
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click "Change Password"
6. Success message displays
7. Modal auto-closes after 2 seconds

## Testing

### Test Forgot Password
```bash
# 1. Start backend
cd backend
./main

# 2. Request password reset
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'

# 3. Check backend logs for reset token
# Look for: "Password reset link: http://localhost:3000/reset-password?token=..."

# 4. Reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN","new_password":"newpassword123"}'

# 5. Login with new password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"newpassword123"}'
```

### Test Change Password
```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"currentpassword"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Change password
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"current_password":"currentpassword","new_password":"newpassword123"}'

# 3. Login with new password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"newpassword123"}'
```

### Run Automated Tests
```bash
# Make sure backend is running, then:
./test_password_management.sh
```

## UI Components

### Login Page
```
┌─────────────────────────────────┐
│        Welcome Back             │
│                                 │
│  Email: [________________]      │
│  Password: [____________]       │
│           Forgot password?      │  ← Click here for password reset
│                                 │
│  [      Log In      ]           │
│                                 │
│  Don't have an account? Sign Up │
└─────────────────────────────────┘
```

### Forgot Password Page
```
┌─────────────────────────────────┐
│      Forgot Password            │
│  Enter your email address and   │
│  we'll send you a reset link    │
│                                 │
│  Email: [________________]      │
│                                 │
│  [  Send Reset Link  ]          │
│                                 │
│        Back to Login            │  ← Click to return
└─────────────────────────────────┘
```

### Reset Password Page
```
┌─────────────────────────────────┐
│      Reset Password             │
│   Enter your new password       │
│                                 │
│  New Password: [__________]     │
│  Confirm: [_______________]     │
│                                 │
│  [   Reset Password   ]         │
│                                 │
│  Redirecting to login...        │  ← After success
└─────────────────────────────────┘
```

### Dashboard with Settings
```
┌─────────────────────────────────────────────┐
│  Real-Time Chat    Welcome, User! [Settings] [Logout]  │  ← Click Settings
└─────────────────────────────────────────────┘
│                                             │
│  When Settings is clicked, modal opens:    │
│                                             │
│  ┌───────────────────────────────┐         │
│  │    Change Password            │         │
│  │                               │         │
│  │ Current: [_______________]    │         │
│  │ New: [___________________]    │         │
│  │ Confirm: [_______________]    │         │
│  │                               │         │
│  │ [Change Password] [Cancel]    │         │
│  └───────────────────────────────┘         │
```

## Error Messages

### Forgot Password
- "Invalid email format" - Email doesn't match pattern
- "If an account with that email exists, a password reset link has been sent." - Generic success (prevents enumeration)

### Reset Password
- "Invalid or expired reset token" - Token doesn't exist or expired
- "Password must be at least 8 characters long" - Password too short
- "Passwords do not match" - New password and confirmation don't match

### Change Password
- "Current password is incorrect" - Wrong current password
- "Password must be at least 8 characters long" - Password too short
- "Passwords do not match" - New password and confirmation don't match
- "New password must be different from current password" - Same password
- "Unauthorized" - No valid JWT token

## Security Notes

1. **Reset tokens expire after 1 hour**
2. **Tokens are single-use** - deleted after successful reset
3. **Generic error messages** - prevent user enumeration
4. **HTTPS recommended** - always use HTTPS in production
5. **Strong passwords** - minimum 8 characters (consider enforcing complexity)

## Database Schema

```sql
-- Users table includes:
reset_token TEXT                 -- Password reset token
reset_token_expires DATETIME     -- When token expires
```

## Configuration

### Required (from .env)
```env
JWT_SECRET=your-secret-key-change-this-in-production
APP_URL=http://localhost:3000
```

### Optional (for email sending)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: If SMTP is not configured, reset links will be printed to backend console logs.

## Troubleshooting

### "Invalid or expired reset token"
- Token may have expired (1 hour limit)
- Token was already used
- Check backend logs for the correct token

### "Current password is incorrect"
- Verify you're entering the correct current password
- Password is case-sensitive

### "Unauthorized" on change password
- Make sure you're logged in
- JWT token may have expired (24 hours)
- Check browser localStorage for valid token

### Email not received
- Check spam folder
- Verify SMTP settings in .env
- Check backend logs for email sending errors
- If SMTP not configured, link is in backend logs

## Production Checklist

- [ ] Configure SMTP settings
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Add rate limiting to prevent abuse
- [ ] Monitor for suspicious password reset activity
- [ ] Consider adding CAPTCHA to prevent automated abuse
- [ ] Set up email delivery monitoring
- [ ] Add password complexity requirements
- [ ] Implement account lockout after failed attempts

