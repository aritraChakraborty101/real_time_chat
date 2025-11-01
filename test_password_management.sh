#!/bin/bash

# Test script for password management features
# Make sure the backend server is running before executing this script

API_URL="http://localhost:8080/api"
TEST_EMAIL="testpassword@example.com"
TEST_USERNAME="testpassuser"
TEST_PASSWORD="password123"
NEW_PASSWORD="newpassword456"

echo "========================================="
echo "Password Management Feature Tests"
echo "========================================="
echo ""

# Clean up - try to delete existing user (might fail if user doesn't exist)
echo "1. Cleaning up any existing test user..."
echo ""

# Register a new test user
echo "2. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")
echo "Registration Response: $REGISTER_RESPONSE"
echo ""

# Verify email (we'll need to get the token from the database or logs)
echo "3. Note: Check backend logs for verification token"
echo "   In production, user would receive this via email"
echo ""

# Manually verify user in database for testing
echo "4. Manually verifying user in database for testing..."
sqlite3 backend/chat.db "UPDATE users SET is_verified = TRUE WHERE email = '$TEST_EMAIL';"
echo "User verified"
echo ""

# Login
echo "5. Logging in with original password..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "Extracted Token: $TOKEN"
echo ""

# Test 1: Request password reset
echo "========================================="
echo "TEST 1: Request Password Reset"
echo "========================================="
FORGOT_RESPONSE=$(curl -s -X POST "$API_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")
echo "Response: $FORGOT_RESPONSE"
echo ""

# Get reset token from database
echo "Getting reset token from database..."
RESET_TOKEN=$(sqlite3 backend/chat.db "SELECT reset_token FROM users WHERE email = '$TEST_EMAIL';")
echo "Reset Token: $RESET_TOKEN"
echo ""

# Test 2: Reset password with token
echo "========================================="
echo "TEST 2: Reset Password with Token"
echo "========================================="
RESET_RESPONSE=$(curl -s -X POST "$API_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"new_password\":\"$NEW_PASSWORD\"}")
echo "Response: $RESET_RESPONSE"
echo ""

# Test 3: Login with new password
echo "========================================="
echo "TEST 3: Login with New Password"
echo "========================================="
LOGIN_NEW_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$NEW_PASSWORD\"}")
echo "Response: $LOGIN_NEW_RESPONSE"
echo ""

# Extract new token
NEW_TOKEN=$(echo $LOGIN_NEW_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "New Token: $NEW_TOKEN"
echo ""

# Test 4: Change password (authenticated user)
echo "========================================="
echo "TEST 4: Change Password (Logged In)"
echo "========================================="
CHANGE_RESPONSE=$(curl -s -X POST "$API_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d "{\"current_password\":\"$NEW_PASSWORD\",\"new_password\":\"$TEST_PASSWORD\"}")
echo "Response: $CHANGE_RESPONSE"
echo ""

# Test 5: Login with changed password
echo "========================================="
echo "TEST 5: Login with Changed Password"
echo "========================================="
LOGIN_FINAL_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
echo "Response: $LOGIN_FINAL_RESPONSE"
echo ""

# Test 6: Try to change password with wrong current password
echo "========================================="
echo "TEST 6: Change Password with Wrong Current Password (Should Fail)"
echo "========================================="
FINAL_TOKEN=$(echo $LOGIN_FINAL_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
WRONG_CHANGE_RESPONSE=$(curl -s -X POST "$API_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FINAL_TOKEN" \
  -d "{\"current_password\":\"wrongpassword\",\"new_password\":\"$NEW_PASSWORD\"}")
echo "Response: $WRONG_CHANGE_RESPONSE"
echo ""

# Test 7: Try to reset password with expired/invalid token
echo "========================================="
echo "TEST 7: Reset Password with Invalid Token (Should Fail)"
echo "========================================="
INVALID_RESET_RESPONSE=$(curl -s -X POST "$API_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"invalidtoken123\",\"new_password\":\"$NEW_PASSWORD\"}")
echo "Response: $INVALID_RESET_RESPONSE"
echo ""

# Cleanup
echo "========================================="
echo "Cleaning up test user..."
echo "========================================="
sqlite3 backend/chat.db "DELETE FROM users WHERE email = '$TEST_EMAIL';"
echo "Test user deleted"
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="
