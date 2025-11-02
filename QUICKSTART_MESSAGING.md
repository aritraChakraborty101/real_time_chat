# Quick Start: One-to-One Messaging (MSG-01)

## Overview
This guide helps you quickly get started with the one-to-one messaging feature.

## Prerequisites
- Backend server running on port 8080
- Frontend server running on port 3000
- At least 2 registered users who are friends

## Quick Test Steps

### 1. Start a Conversation

#### Option A: From Friends List
1. Log in to your account
2. Click "Friends" in the sidebar
3. Find a friend in the list
4. Click the chat icon (💬) next to their name
5. Chat interface opens in a modal

#### Option B: From User Profile
1. Log in to your account
2. Search for a friend
3. Click on their profile
4. Click "Send Message" button
5. Chat interface opens in a modal

#### Option C: From Messages Menu
1. Log in to your account
2. Click "Messages" in the sidebar
3. View all your conversations
4. Click on any conversation to open it

### 2. Send a Message

1. Type your message in the input field at the bottom
2. Click the send button (✈️ icon) or press Enter
3. Your message appears as a blue bubble on the right
4. Messages from your friend appear as gray bubbles on the left

### 3. View Conversation History

1. Open any chat
2. Scroll up to see older messages
3. All messages are loaded automatically
4. New messages appear at the bottom

## Features Demonstrated

### Chat Interface Header
- Friend's profile picture (or initial)
- Friend's display name and username
- Verification badge (if verified)

### Message Display
- Your messages: Blue bubbles on the right
- Friend's messages: Gray bubbles on the left
- Timestamps: Shown below each message
- Auto-scroll to latest message

### Conversations List
- All active conversations
- Last message preview
- Relative timestamps ("2:30 PM", "Yesterday", etc.)
- Click to open full conversation

## API Examples

### Send a Message (using curl)

```bash
# Get your token first (from login response)
TOKEN="your-jwt-token-here"

# Send a message to friend with ID 2
curl -X POST http://localhost:8080/api/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": 2,
    "content": "Hello from the API!"
  }'
```

### Get Your Conversations

```bash
curl http://localhost:8080/api/messages/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### Get Messages with a Friend

```bash
# Get messages with friend ID 2
curl "http://localhost:8080/api/messages?friend_id=2" \
  -H "Authorization: Bearer $TOKEN"
```

## Testing Scenario

### Create a Complete Test

1. **Setup** (Do once):
   - Register two users (user1@test.com and user2@test.com)
   - Have user1 send friend request to user2
   - Have user2 accept the friend request

2. **Test Messaging**:
   - Log in as user1
   - Navigate to Friends list
   - Click chat icon next to user2
   - Send message: "Hi user2!"
   
3. **Verify Other Side**:
   - Log in as user2 (in different browser/incognito)
   - Navigate to Messages
   - See conversation with user1
   - Open the conversation
   - See message "Hi user2!"
   - Reply: "Hello user1!"
   
4. **Check Updates**:
   - Go back to user1's chat (wait ~3 seconds for poll)
   - See user2's reply appear

## Troubleshooting

### Messages Not Appearing
- **Issue**: Sent message doesn't show up
- **Solution**: Wait 3 seconds (polling interval) or refresh the chat

### Can't Send Message to User
- **Issue**: Error when trying to message someone
- **Solution**: Ensure you're friends with that user (friendship must be accepted)

### Chat Button Not Showing
- **Issue**: No chat icon in friends list
- **Solution**: Ensure the user is in your friends list (not pending)

### Empty Conversations List
- **Issue**: Messages menu shows no conversations
- **Solution**: Start a conversation first by messaging a friend

## Current Limitations

1. **Polling Updates**: Messages update every 3 seconds (not real-time)
2. **No Online Status**: Can't see if friend is online/offline
3. **No Typing Indicator**: Can't see when friend is typing
4. **Text Only**: Can't send images or files yet
5. **No Unread Count**: Unread messages not tracked yet

## Next Steps

After testing basic messaging, try:
- Start multiple conversations with different friends
- Check conversation history persists after logout/login
- Test sending longer messages
- Try the different entry points (profile, friends list, messages menu)

## Need Help?

- Check `MSG-01-IMPLEMENTATION.md` for detailed documentation
- Review `MSG-01-SUMMARY.md` for feature overview
- Check backend logs for API errors
- Open browser console for frontend errors

## Quick Reference

### Keyboard Shortcuts
- **Enter**: Send message (in chat input)

### Navigation
- **Sidebar → Messages**: View all conversations
- **Sidebar → Friends**: Access friends list
- **Friend Card → Chat Icon**: Start conversation
- **User Profile → Send Message**: Start conversation

### Status Indicators
- **Blue bubble**: Your message
- **Gray bubble**: Friend's message
- **Blue checkmark**: Verified user

Enjoy messaging! 💬
