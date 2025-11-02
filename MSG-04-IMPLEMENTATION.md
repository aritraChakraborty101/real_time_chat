# MSG-04: Message Interactions and Management - Implementation Guide

## Overview
Implementation of message management features including deletion (for me/everyone), editing within time limits, and message replies with quoting functionality.

## Acceptance Criteria

### AC1: Delete Message (Delete for Me / Delete for Everyone) ✅
**Requirement:** A user can delete a message they have sent with options for "Delete for Me" and "Delete for Everyone".

**Implementation:**
- **Delete for Me:** Marks message as deleted only for the sender (soft delete)
- **Delete for Everyone:** Replaces message content with "This message was deleted" for all participants
- **Time Limit:** Delete for everyone allowed within 15 minutes of sending
- **Database:** `is_deleted` and `deleted_for_everyone` boolean flags
- **UI:** Contextmenu with both delete options on message hover

**API Endpoint:**
- `POST /api/messages/delete` - Delete message with options

### AC2: Edit Message ✅
**Requirement:** A user can edit the content of a message they have sent within a certain time frame.

**Implementation:**
- **Time Limit:** 15 minutes from message creation
- **Editing Indicator:** "( edited)" badge shown on edited messages
- **Edit Tracking:** `is_edited` flag and `edited_at` timestamp
- **UI:** Edit button appears on hover, inline edit mode
- **Validation:** Cannot edit deleted messages

**API Endpoint:**
- `POST /api/messages/edit` - Edit message content

### AC3: Reply to Message (Quoting) ✅
**Requirement:** A user can reply directly to a specific message, quoting it in their response.

**Implementation:**
- **Reply Reference:** `reply_to_message_id` foreign key to messages table
- **Quote Display:** Quoted message shown above the reply
- **Reply Indicator:** Visual quote block with original message preview
- **Navigation:** Reply references maintain context
- **UI:** Reply button on all messages, quote shown in message bubble

**Database:** Foreign key relationship with CASCADE on delete

## Database Changes

### Messages Table
```sql
ALTER TABLE messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE messages 
ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE;

ALTER TABLE messages 
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

ALTER TABLE messages 
ADD COLUMN edited_at DATETIME;

ALTER TABLE messages 
ADD COLUMN reply_to_message_id INTEGER 
REFERENCES messages(id) ON DELETE SET NULL;
```

### Group Messages Table
```sql
ALTER TABLE group_messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE group_messages 
ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE;

ALTER TABLE group_messages 
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

ALTER TABLE group_messages 
ADD COLUMN edited_at DATETIME;

ALTER TABLE group_messages 
ADD COLUMN reply_to_message_id INTEGER 
REFERENCES group_messages(id) ON DELETE SET NULL;
```

## Backend Implementation

### Files Modified

#### 1. database/db.go
- Updated messages table schema with new columns
- Updated group_messages table schema
- Added foreign key for reply_to_message_id
- Created index for reply relationships

#### 2. models/user.go
**Updated Message struct:**
```go
type Message struct {
    ID                 int       `json:"id"`
    ConversationID     int       `json:"conversation_id"`
    SenderID           int       `json:"sender_id"`
    Content            string    `json:"content"`
    Status             string    `json:"status"`
    IsDeleted          bool      `json:"is_deleted"`
    DeletedForEveryone bool      `json:"deleted_for_everyone"`
    IsEdited           bool      `json:"is_edited"`
    EditedAt           *time.Time `json:"edited_at,omitempty"`
    ReplyToMessageID   *int      `json:"reply_to_message_id,omitempty"`
    ReplyToMessage     *Message  `json:"reply_to_message,omitempty"`
    CreatedAt          time.Time `json:"created_at"`
}
```

**New Request Types:**
```go
type DeleteMessageRequest struct {
    MessageID        int  `json:"message_id"`
    DeleteForEveryone bool `json:"delete_for_everyone"`
}

type EditMessageRequest struct {
    MessageID  int    `json:"message_id"`
    NewContent string `json:"new_content"`
}

type SendMessageWithReplyRequest struct {
    RecipientID      int    `json:"recipient_id"`
    Content          string `json:"content"`
    ReplyToMessageID *int   `json:"reply_to_message_id,omitempty"`
}
```

#### 3. handlers/messages.go
**New Handlers:**
- `DeleteMessage()` - Handle message deletion
  - Validates ownership
  - Checks 15-minute time limit for delete for everyone
  - Updates message flags accordingly
  
- `EditMessage()` - Handle message editing
  - Validates ownership
  - Checks 15-minute time limit
  - Prevents editing deleted messages
  - Updates content and sets edited flag

**Modified Handlers:**
- `SendMessage()` - Now supports reply_to_message_id
  - Validates reply reference exists in same conversation
  - Stores reply relationship
  
- `GetMessages()` - Returns full message data
  - Includes all new fields
  - Fetches replied-to message when present
  - Loads complete message chain

#### 4. routes/router.go
**New Routes:**
```go
http.HandleFunc("/api/messages/delete", ...) 
http.HandleFunc("/api/messages/edit", ...)
```

## Frontend Implementation

### Files Modified

#### 1. types/auth.ts
**Updated Message interface:**
```typescript
interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  status: string;
  is_deleted: boolean;
  deleted_for_everyone: boolean;
  is_edited: boolean;
  edited_at?: string;
  reply_to_message_id?: number;
  reply_to_message?: Message;
  created_at: string;
}
```

**New Request Types:**
```typescript
interface DeleteMessageRequest {
  message_id: number;
  delete_for_everyone: boolean;
}

interface EditMessageRequest {
  message_id: number;
  new_content: string;
}
```

#### 2. services/messageService.ts
**New Methods:**
```typescript
sendMessage(recipientId, content, replyToMessageId?)
deleteMessage(messageId, deleteForEveryone)
editMessage(messageId, newContent)
```

#### 3. components/ChatInterface.tsx
**New State:**
- `replyToMessage` - Message being replied to
- `editingMessage` - Message being edited
- `editContent` - Edit input content

**New Functions:**
```typescript
handleDeleteMessage(messageId, deleteForEveryone)
handleEditMessage(message)
handleReplyToMessage(message)
cancelEdit()
cancelReply()
canEditMessage(message) // Check 15-min limit
canDeleteMessage(message) // Check ownership
```

**UI Components Added:**
1. **Context Menu** - Hover actions on messages
   - Edit button (own messages < 15 min)
   - Reply button (all messages)
   - Delete for me button
   - Delete for everyone button (< 15 min)

2. **Reply/Edit Indicator** - Above input field
   - Shows which message is being replied to/edited
   - Cancel button to clear action
   - Visual distinction between reply and edit mode

3. **Message Bubble Updates:**
   - Reply quote block shown above message
   - "(edited)" badge on edited messages
   - Deleted message placeholder text
   - Visual styling for deleted messages

## Message Deletion Flow

### Delete for Me
```
User clicks delete → Confirmation dialog
                   → POST /api/messages/delete {delete_for_everyone: false}
                   → UPDATE messages SET is_deleted = TRUE
                   → Message hidden for sender only
                   → Recipient still sees message
```

### Delete for Everyone
```
User clicks delete for everyone → Time check (< 15 min)
                                → Confirmation dialog
                                → POST /api/messages/delete {delete_for_everyone: true}
                                → UPDATE messages SET is_deleted = TRUE, 
                                                      deleted_for_everyone = TRUE,
                                                      content = 'This message was deleted'
                                → All users see deletion notice
```

## Message Editing Flow

```
User clicks edit → Time check (< 15 min)
                 → Edit mode activated
                 → User modifies content
                 → Click send/save
                 → POST /api/messages/edit
                 → UPDATE messages SET content = new_content,
                                      is_edited = TRUE,
                                      edited_at = CURRENT_TIMESTAMP
                 → Message updated for all users
                 → "(edited)" badge appears
```

## Message Reply Flow

```
User clicks reply → Reply mode activated
                  → Original message shown in quote box
                  → User types response
                  → Click send
                  → POST /api/messages/send {reply_to_message_id: X}
                  → INSERT INTO messages (..., reply_to_message_id)
                  → Message sent with reply reference
                  → Quote box shown in conversation
```

## UI Components

### Context Menu (Message Hover)
```tsx
{isOwnMessage && !isDeleted && (
  <div className="opacity-0 group-hover:opacity-100">
    {canEditMessage(message) && (
      <button onClick={() => handleEditMessage(message)}>Edit</button>
    )}
    <button onClick={() => handleReplyToMessage(message)}>Reply</button>
    <button onClick={() => handleDeleteMessage(message.id, false)}>
      Delete for Me
    </button>
    {canEditMessage(message) && (
      <button onClick={() => handleDeleteMessage(message.id, true)}>
        Delete for Everyone
      </button>
    )}
  </div>
)}
```

### Reply Quote Display
```tsx
{message.reply_to_message && (
  <div className="reply-quote">
    <p>Replying to:</p>
    <p className="truncate">{message.reply_to_message.content}</p>
  </div>
)}
```

### Edit/Reply Indicator
```tsx
{(replyToMessage || editingMessage) && (
  <div className="indicator">
    <p>{editingMessage ? 'Editing message' : 'Replying to...'}</p>
    <p>{editingMessage ? editingMessage.content : replyToMessage?.content}</p>
    <button onClick={editingMessage ? cancelEdit : cancelReply}>✕</button>
  </div>
)}
```

### Edited Message Badge
```tsx
{message.is_edited && <span>(edited)</span>}
```

### Deleted Message Display
```tsx
{isDeleted ? (
  message.deleted_for_everyone ? 
    '🚫 This message was deleted' : 
    '🚫 You deleted this message'
) : (
  message.content
)}
```

## Time Constraints

### 15-Minute Edit/Delete Window
```typescript
// Frontend check
const canEditMessage = (message: Message): boolean => {
  const createdAt = new Date(message.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  return diffMinutes < 15;
};

// Backend check
timeSinceCreation := time.Since(createdAt)
if timeSinceCreation > 15*time.Minute {
    return error("Time limit exceeded")
}
```

## Security & Validation

### Authorization Checks
- ✅ Users can only delete their own messages
- ✅ Users can only edit their own messages
- ✅ Cannot edit deleted messages
- ✅ Cannot delete already deleted messages
- ✅ Reply references validated for same conversation

### Time Validation
- ✅ 15-minute limit enforced server-side
- ✅ Client-side check for immediate feedback
- ✅ Delete for everyone restricted to time window
- ✅ Edit restricted to time window

### Data Integrity
- ✅ Reply references use foreign keys
- ✅ ON DELETE SET NULL for reply cascade
- ✅ Soft delete preserves message history
- ✅ Edit history tracked with timestamp

## API Documentation

### Delete Message
```http
POST /api/messages/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "message_id": 123,
  "delete_for_everyone": true
}

Response: 200 OK
{
  "message": "Message deleted successfully",
  "delete_for_everyone": true
}
```

### Edit Message
```http
POST /api/messages/edit
Authorization: Bearer {token}
Content-Type: application/json

{
  "message_id": 123,
  "new_content": "Updated message content"
}

Response: 200 OK
{
  "message": {
    "id": 123,
    "content": "Updated message content",
    "is_edited": true,
    "edited_at": "2025-11-02T10:30:00Z",
    ...
  }
}
```

### Send Message with Reply
```http
POST /api/messages/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipient_id": 456,
  "content": "This is my reply",
  "reply_to_message_id": 123
}

Response: 201 Created
{
  "message": {
    "id": 789,
    "content": "This is my reply",
    "reply_to_message_id": 123,
    "reply_to_message": {
      "id": 123,
      "content": "Original message",
      ...
    },
    ...
  }
}
```

## Error Handling

### Common Errors
```json
// Not message owner
{
  "error": "You can only delete your own messages"
}

// Time limit exceeded
{
  "error": "Can only edit messages within 15 minutes of sending"
}

// Message not found
{
  "error": "Message not found"
}

// Cannot edit deleted message
{
  "error": "Cannot edit a deleted message"
}

// Invalid reply reference
{
  "error": "Invalid reply_to_message_id"
}
```

## Testing Checklist

- [x] Can delete own message (delete for me)
- [x] Can delete own message for everyone (within 15 min)
- [x] Cannot delete for everyone after 15 minutes
- [x] Cannot delete other users' messages
- [x] Deleted messages show appropriate placeholder
- [x] Can edit own message (within 15 min)
- [x] Cannot edit after 15 minutes
- [x] Edited messages show "(edited)" badge
- [x] Cannot edit deleted messages
- [x] Can reply to any message
- [x] Reply quote appears above new message
- [x] Reply references maintained
- [x] Reply chain displays correctly
- [x] Context menu appears on hover
- [x] Edit/reply indicators work correctly
- [x] Database migrations applied
- [x] Backend builds successfully
- [x] Frontend builds successfully

## User Experience

### Before MSG-04
- No way to fix typos in sent messages
- No way to remove embarrassing messages
- No way to quote/reference previous messages
- Messages permanent once sent

### After MSG-04 ✅
- Quick edit within 15 minutes
- Delete mistakes (for me or everyone)
- Reply with context (quoting)
- Clear visual feedback
- Intuitive hover actions
- Professional messaging experience

## Known Limitations

1. **15-Minute Window:** Fixed time limit (could be made configurable)
2. **No Edit History:** Only tracks that message was edited, not full history
3. **Soft Delete:** Deleted messages remain in database
4. **No Undo:** Delete/edit actions are immediate (no undo buffer)

## Future Enhancements

- [ ] Configurable time limits per organization
- [ ] Full edit history tracking
- [ ] Undo/redo functionality
- [ ] Pin important messages
- [ ] Forward messages
- [ ] Search within conversation
- [ ] Message reactions
- [ ] Multi-select for bulk delete

## Performance Considerations

- Reply fetching adds extra query (negligible overhead)
- Edit/delete operations are single UPDATE queries
- Time checks done in application layer (fast)
- No performance degradation observed

---

**Implementation Date:** November 2, 2025  
**Status:** Complete ✅  
**Build Status:** Backend ✅ | Frontend ✅
