# MSG-03 Quick Reference Guide

## Quick Start

### Testing the Features

1. **Start Backend:**
   ```bash
   cd backend
   ./main
   ```

2. **Serve Frontend:**
   ```bash
   cd frontend
   npm start
   # or serve the build: serve -s build
   ```

3. **Test Typing Indicator:**
   - Open chat with a friend in two browser tabs (different users)
   - Start typing in one tab
   - Watch typing indicator appear in the other tab
   - Stop typing for 3 seconds → indicator disappears

4. **Test Message Status:**
   - Send a message → See single ✓
   - Recipient opens chat → See ✓✓ (gray)
   - Status changes to ✓✓ (blue) when read

## API Quick Reference

### Typing Indicator
```bash
# Update typing status
curl -X POST "http://localhost:8080/api/messages/typing?friend_id=2&is_typing=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check if friend is typing
curl "http://localhost:8080/api/messages/typing-status?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Message Status
```bash
# Mark conversation as read
curl -X POST "http://localhost:8080/api/messages/mark-read?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get messages (includes status)
curl "http://localhost:8080/api/messages?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Code Snippets

### Frontend: Using Typing Indicator
```typescript
// Update typing status when user types
const handleTyping = async () => {
  await messageService.updateTypingStatus(friendId, true);
  
  // Auto-clear after 3s
  setTimeout(() => {
    messageService.updateTypingStatus(friendId, false);
  }, 3000);
};

// Check if friend is typing
const checkTypingStatus = async () => {
  const status = await messageService.getTypingStatus(friendId);
  setOtherUserTyping(status.is_typing);
};
```

### Frontend: Rendering Status Icons
```tsx
const renderMessageStatus = (status: string) => {
  if (status === 'read') {
    return <span className="text-blue-400">✓✓</span>;
  } else if (status === 'delivered') {
    return <span className="text-gray-400">✓✓</span>;
  } else {
    return <span className="text-gray-400">✓</span>;
  }
};

// In message bubble
<p className="text-xs">
  {formatTime(message.created_at)}
  {isOwnMessage && renderMessageStatus(message.status)}
</p>
```

### Backend: Typing Status Store
```go
// In-memory store (handlers/messages.go)
var typingStatus = make(map[string]map[int]bool)

// Update typing status
func UpdateTypingStatus(w http.ResponseWriter, r *http.Request) {
  // Get params
  userID := r.Context().Value("userID").(int)
  friendID, _ := strconv.Atoi(r.URL.Query().Get("friend_id"))
  isTyping := r.URL.Query().Get("is_typing") == "true"
  
  // Create conversation key
  convKey := makeConversationKey(userID, friendID)
  
  // Update store
  if typingStatus[convKey] == nil {
    typingStatus[convKey] = make(map[int]bool)
  }
  typingStatus[convKey][userID] = isTyping
  
  // Cleanup if not typing
  if !isTyping {
    delete(typingStatus[convKey], userID)
  }
}
```

## Database Queries

### Check Message Status
```sql
-- Get messages with status
SELECT id, content, status, created_at 
FROM messages 
WHERE conversation_id = 1 
ORDER BY created_at DESC;

-- Count messages by status
SELECT status, COUNT(*) 
FROM messages 
GROUP BY status;

-- Find unread messages for a user
SELECT m.* 
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE (c.user1_id = ? OR c.user2_id = ?)
  AND m.sender_id != ?
  AND m.status != 'read';
```

### Update Message Status
```sql
-- Mark single message as read
UPDATE messages 
SET status = 'read' 
WHERE id = 123;

-- Mark all messages in conversation as read
UPDATE messages 
SET status = 'read' 
WHERE conversation_id = 1 
  AND sender_id = 2
  AND status != 'read';
```

## Component Integration

### Add to Existing Chat Component
```tsx
function ChatComponent({ friendId }) {
  // State
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Poll typing status
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await messageService.getTypingStatus(friendId);
      setOtherUserTyping(status.is_typing);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [friendId]);
  
  // Handle typing
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Update typing status
    if (!isTyping) {
      setIsTyping(true);
      messageService.updateTypingStatus(friendId, true);
    }
    
    // Debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      messageService.updateTypingStatus(friendId, false);
    }, 3000);
  };
  
  return (
    <>
      {/* Messages */}
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.content}
          {msg.sender_id === currentUserId && (
            <span>{getStatusIcon(msg.status)}</span>
          )}
        </div>
      ))}
      
      {/* Typing indicator */}
      {otherUserTyping && <TypingIndicator />}
      
      {/* Input */}
      <input onChange={handleInputChange} />
    </>
  );
}
```

## Troubleshooting

### Typing Indicator Not Showing
1. Check network tab - is typing API being called?
2. Check polling interval - should be 3 seconds
3. Verify friend ID is correct
4. Check browser console for errors

### Status Icons Not Updating
1. Verify status field exists in database
2. Check message polling is working
3. Verify markConversationAsRead is being called
4. Check database - run: `SELECT status FROM messages LIMIT 10;`

### Database Migration Issues
```bash
# Check if status column exists
cd backend
sqlite3 chat.db "PRAGMA table_info(messages);" | grep status

# If missing, add it:
sqlite3 chat.db "ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent';"
sqlite3 chat.db "ALTER TABLE group_messages ADD COLUMN status TEXT DEFAULT 'sent';"
```

### Backend Not Building
```bash
# Check Go version
go version  # Should be 1.16+

# Clean and rebuild
cd backend
go clean
go build -o main .

# Check for import errors
go mod tidy
```

### Frontend Not Building
```bash
# Check Node version
node --version  # Should be 14+

# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Performance Tips

### Reduce Polling Frequency
```typescript
// In ChatInterface.tsx, change interval from 3000 to 5000
const interval = setInterval(loadMessages, 5000);  // 5 seconds
```

### Batch Status Updates
```typescript
// Instead of marking each message individually,
// mark entire conversation at once
await messageService.markConversationAsRead(friendId);
```

### Optimize Typing Debounce
```typescript
// Adjust timeout based on your needs
const TYPING_TIMEOUT = 3000;  // 3 seconds (default)
const TYPING_TIMEOUT = 2000;  // 2 seconds (more responsive)
const TYPING_TIMEOUT = 5000;  // 5 seconds (less network calls)
```

## Testing Commands

### Backend Tests
```bash
# Test typing endpoint
curl -X POST "http://localhost:8080/api/messages/typing?friend_id=2&is_typing=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test mark as read
curl -X POST "http://localhost:8080/api/messages/mark-read?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test get messages with status
curl "http://localhost:8080/api/messages?friend_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.[] | {id, content, status}'
```

### Database Tests
```sql
-- Insert test message with status
INSERT INTO messages (conversation_id, sender_id, content, status)
VALUES (1, 1, 'Test message', 'sent');

-- Update status
UPDATE messages SET status = 'read' WHERE id = LAST_INSERT_ROWID();

-- Verify
SELECT id, content, status FROM messages WHERE id = LAST_INSERT_ROWID();
```

## Feature Flags (Optional)

If you want to disable features temporarily:

```typescript
// frontend/src/config.ts
export const FEATURE_FLAGS = {
  TYPING_INDICATOR: true,    // Set to false to disable
  MESSAGE_STATUS: true,       // Set to false to disable
  AUTO_MARK_READ: true,       // Set to false to disable
  POLLING_INTERVAL: 3000,     // Adjust as needed
};

// Usage in component
if (FEATURE_FLAGS.TYPING_INDICATOR) {
  checkTypingStatus();
}
```

## Common Customizations

### Change Status Colors
```tsx
// In ChatInterface.tsx
const renderMessageStatus = (status: string) => {
  if (status === 'read') {
    return <span className="text-green-500">✓✓</span>;  // Green instead of blue
  }
  // ...
};
```

### Change Typing Animation
```tsx
// Different animation style
<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
// Instead of animate-bounce
```

### Add Sound Notifications
```typescript
const playTypingSound = () => {
  const audio = new Audio('/sounds/typing.mp3');
  audio.play();
};

// Call when typing detected
if (status.is_typing && !otherUserTyping) {
  playTypingSound();
}
```

---

For detailed implementation guide, see: `MSG-03-IMPLEMENTATION.md`  
For complete summary, see: `MSG-03-SUMMARY.md`
