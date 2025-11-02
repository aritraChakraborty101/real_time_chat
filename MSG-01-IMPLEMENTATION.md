# User Story: MSG-01 | One-to-One Conversations

## Overview
This document describes the implementation of one-to-one messaging functionality, allowing users to start and participate in private conversations with their friends.

## Acceptance Criteria

### AC1: Conversation Initiation ✅
A conversation can be initiated from:
- **Friend's profile**: Click "Send Message" button on a friend's profile
- **Friends list**: Click the chat icon next to any friend in the friends list
- **Conversations page**: Navigate to existing conversations from the Messages menu

### AC2: Chat Interface Header ✅
The chat interface displays:
- **Friend's name**: Display name or username
- **Profile picture**: Avatar or default gradient with initial
- **Verification badge**: Blue checkmark for verified users
- **Username**: Displayed as @username below the display name

Note: Online status is not implemented in this version (requires WebSocket presence system).

### AC3: Message Display Format ✅
Messages are displayed in chronological bubble format:
- **Own messages**: Blue bubbles aligned to the right
- **Friend's messages**: Gray bubbles aligned to the left
- **Message content**: Text content with word wrapping
- **Timestamps**: Relative time display (e.g., "2:30 PM", "Yesterday", "Nov 1")
- **Rounded corners**: Bubbles have rounded corners with appropriate styling

### AC4: Chat History ✅
Full chat history features:
- **All messages loaded**: Complete conversation history
- **Scrollable view**: Messages area is scrollable
- **Auto-scroll**: Automatically scrolls to bottom when new messages arrive
- **Empty state**: Friendly message when no messages exist yet
- **Persistent storage**: Messages stored in SQLite database

## Implementation Details

### Database Schema

#### Conversations Table
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

#### Messages Table
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

### Backend Endpoints

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer <token>
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

**Business Rules:**
- Users can only send messages to friends (accepted friendship status)
- Message content cannot be empty
- Cannot send messages to self
- Conversation is automatically created if it doesn't exist
- user1_id is always less than user2_id for consistency

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "other_user": {
      "id": 2,
      "username": "johndoe",
      "display_name": "John Doe",
      "profile_picture": "...",
      "is_verified": true,
      "created_at": "2025-10-30T06:25:36Z"
    },
    "last_message": {
      "id": 15,
      "conversation_id": 1,
      "sender_id": 1,
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
Authorization: Bearer <token>
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
  },
  {
    "id": 2,
    "conversation_id": 1,
    "sender_id": 2,
    "content": "Hi there!",
    "created_at": "2025-11-02T07:01:00Z"
  }
]
```

### Frontend Components

#### ChatInterface Component
- **Location**: `frontend/src/components/ChatInterface.tsx`
- **Features**:
  - Chat header with friend info
  - Scrollable message area
  - Message bubbles with timestamps
  - Message input with send button
  - Auto-scroll to bottom
  - Polling for new messages (every 3 seconds)
  - Loading and error states

#### Conversations Component
- **Location**: `frontend/src/components/Conversations.tsx`
- **Features**:
  - List of all conversations
  - Shows last message preview
  - Displays timestamp
  - Shows unread count (placeholder for future implementation)
  - Click to open chat interface
  - Polling for updates (every 5 seconds)

#### Updated Components
- **FriendsList**: Added chat button to initiate conversations
- **UserProfileView**: Added "Send Message" button for friends
- **Dashboard**: Added Messages route
- **Sidebar**: Added Messages menu item

### Services

#### messageService
- **Location**: `frontend/src/services/messageService.ts`
- **Methods**:
  - `sendMessage(recipientId, content)`: Send a message
  - `getConversations()`: Get all conversations
  - `getMessages(friendId)`: Get messages with a specific friend

### Navigation Flow

1. **From Friends List**:
   - Friends List → Click chat icon → Chat Interface opens in modal

2. **From User Profile**:
   - User Profile → Click "Send Message" → Chat Interface opens in modal

3. **From Messages Menu**:
   - Sidebar → Messages → Conversations List → Click conversation → Chat Interface

## Security Features

- **Friend verification**: Can only message accepted friends
- **Authorization**: All endpoints require JWT authentication
- **User ID from token**: Sender ID extracted from JWT, not client request
- **SQL injection protection**: Parameterized queries used throughout
- **Conversation ownership**: Users can only access their own conversations

## Current Limitations

1. **No real-time updates**: Uses polling instead of WebSockets
   - Messages poll every 3 seconds
   - Conversations poll every 5 seconds
   - Future: Implement WebSocket for real-time delivery

2. **No online status**: Friend's online/offline status not shown
   - Requires WebSocket presence system
   - Future enhancement

3. **No typing indicators**: No "user is typing..." feature
   - Requires WebSocket support
   - Future enhancement

4. **No unread count**: Unread message count not implemented
   - Database structure supports it
   - Needs read receipt tracking

5. **No file attachments**: Text-only messages
   - Future: Add image/file upload support

6. **No message editing/deletion**: Messages are permanent
   - Future: Add edit/delete functionality

7. **No message search**: Cannot search within conversations
   - Future: Add search functionality

## Testing

### Manual Testing Steps

1. **Initiate conversation from friend list**:
   - Navigate to Friends page
   - Click chat icon next to a friend
   - Verify chat interface opens
   - Verify friend info displayed correctly in header

2. **Send and receive messages**:
   - Type a message and send
   - Verify message appears in bubble on the right (blue)
   - Have friend send a message back
   - Verify their message appears on the left (gray)
   - Check timestamps are displayed

3. **View conversations list**:
   - Navigate to Messages page
   - Verify all conversations are listed
   - Check last message preview shown
   - Click on a conversation
   - Verify full chat history loads

4. **Message from user profile**:
   - Search for a friend
   - Open their profile
   - Click "Send Message"
   - Verify chat interface opens
   - Send a message

### API Testing

```bash
# Send a message
curl -X POST http://localhost:8080/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": 2, "content": "Hello!"}'

# Get conversations
curl http://localhost:8080/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get messages with friend
curl "http://localhost:8080/api/messages?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

1. **WebSocket Integration**:
   - Real-time message delivery
   - Online/offline status
   - Typing indicators
   - Message delivery receipts

2. **Rich Media**:
   - Image attachments
   - File sharing
   - Emoji picker
   - GIF support

3. **Message Management**:
   - Edit messages
   - Delete messages
   - Reply to specific messages
   - Message reactions

4. **Notifications**:
   - Browser push notifications
   - Unread message badges
   - Sound alerts

5. **Search & Filter**:
   - Search messages
   - Filter conversations
   - Archive conversations

6. **User Experience**:
   - Message read receipts
   - Delivery status indicators
   - Better timestamp formatting
   - Message grouping by date

## Files Changed/Added

### Backend
- ✅ `database/db.go`: Added conversations and messages tables
- ✅ `models/user.go`: Added Message, Conversation, and related models
- ✅ `handlers/messages.go`: New handler for message operations
- ✅ `routes/router.go`: Added message endpoints

### Frontend
- ✅ `types/auth.ts`: Added message and conversation types
- ✅ `services/messageService.ts`: New service for message API calls
- ✅ `components/ChatInterface.tsx`: New chat UI component
- ✅ `components/Conversations.tsx`: New conversations list component
- ✅ `components/FriendsList.tsx`: Added chat button
- ✅ `components/UserProfileView.tsx`: Added send message button
- ✅ `components/Dashboard.tsx`: Added messages route
- ✅ `components/Sidebar.tsx`: Added messages menu item

## Conclusion

The one-to-one conversation feature has been successfully implemented with all acceptance criteria met. Users can now:
- Start conversations from friend profiles or the friends list
- View a clean chat interface with friend information
- Send and receive messages in a bubble format
- Access full chat history

The implementation uses polling for updates but is designed to be easily upgraded to WebSockets in the future for real-time functionality.
