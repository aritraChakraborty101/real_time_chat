#!/bin/bash

echo "=== Real-Time Chat Authentication Test ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080/api"

echo -e "${YELLOW}1. Testing user registration...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","username":"demouser","password":"demo12345"}')

if echo $RESPONSE | grep -q "Registration successful"; then
    echo -e "${GREEN}✓ Registration successful${NC}"
else
    echo -e "${RED}✗ Registration failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}2. Testing duplicate email (should fail)...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","username":"another","password":"demo12345"}')

if echo $RESPONSE | grep -q "Email already registered"; then
    echo -e "${GREEN}✓ Duplicate email correctly rejected${NC}"
else
    echo -e "${RED}✗ Duplicate email check failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}3. Testing duplicate username (should fail)...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","username":"demouser","password":"demo12345"}')

if echo $RESPONSE | grep -q "Username already taken"; then
    echo -e "${GREEN}✓ Duplicate username correctly rejected${NC}"
else
    echo -e "${RED}✗ Duplicate username check failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}4. Testing login before verification (should fail)...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo12345"}')

if echo $RESPONSE | grep -q "verify your email"; then
    echo -e "${GREEN}✓ Unverified user correctly blocked${NC}"
else
    echo -e "${RED}✗ Verification check failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}5. Getting verification token from database...${NC}"
TOKEN=$(sqlite3 backend/chat.db "SELECT verification_token FROM users WHERE email='demo@example.com';")
echo "Token: ${TOKEN:0:20}..."
echo ""

echo -e "${YELLOW}6. Testing email verification...${NC}"
RESPONSE=$(curl -s "$BASE_URL/auth/verify?token=$TOKEN")

if echo $RESPONSE | grep -q "verified successfully"; then
    echo -e "${GREEN}✓ Email verified successfully${NC}"
else
    echo -e "${RED}✗ Verification failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}7. Testing login after verification...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo12345"}')

if echo $RESPONSE | grep -q "token"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "JWT Token received: $(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-30)..."
    echo "User: $(echo $RESPONSE | grep -o '"username":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}✗ Login failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}8. Testing invalid credentials...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"wrongpassword"}')

if echo $RESPONSE | grep -q "Invalid email or password"; then
    echo -e "${GREEN}✓ Invalid credentials correctly rejected${NC}"
else
    echo -e "${RED}✗ Invalid credentials check failed: $RESPONSE${NC}"
fi
echo ""

echo -e "${GREEN}=== All tests completed ===${NC}"
