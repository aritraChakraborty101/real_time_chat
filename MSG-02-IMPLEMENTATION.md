# MSG-02: Group Chat Creation and Management - Implementation Guide

## Status: ✅ COMPLETE

All acceptance criteria have been successfully implemented.

## Acceptance Criteria Status

| AC | Description | Implementation | Status |
|----|-------------|----------------|--------|
| AC1 | Create group with 2+ friends | Backend validation + CreateGroup UI | ✅ Complete |
| AC2 | Set group name and picture | CreateGroup form fields | ✅ Complete |
| AC3 | Members can add new members | Add member API + UI in GroupChat | ✅ Complete |
| AC4 | Members can leave group | Leave group API + Leave button | ✅ Complete |
| AC5 | Admins can remove members | Remove member API (admin only) + UI | ✅ Complete |

## Database Schema

### Groups Table
```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    group_picture TEXT,
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
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### Create Group (AC1 & AC2)
```http
POST /api/groups/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Study Group",
  "description": "CS students study group",
  "group_picture": "https://example.com/pic.jpg",
  "member_ids": [2, 3, 4]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Study Group",
  "description": "CS students study group",
  "group_picture": "https://example.com/pic.jpg",
  "created_by": 1,
  "member_count": 4,
  "members": [...],
  "user_role": "admin",
  "created_at": "2025-11-02T08:00:00Z",
  "updated_at": "2025-11-02T08:00:00Z"
}
```

**Business Rules:**
- Requires at least 2 total members (creator + 1 friend)
- All members must be friends with the creator
- Creator is automatically added as admin
- Other members are added as regular members

### Get User Groups
```http
GET /api/groups
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Study Group",
    "member_count": 4,
    "user_role": "admin",
    "last_message": {
      "content": "See you tomorrow!",
      "created_at": "2025-11-02T08:30:00Z"
    },
    "updated_at": "2025-11-02T08:30:00Z"
  }
]
```

### Get Group Details
```http
GET /api/groups/details?group_id=1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Study Group",
  "description": "CS students study group",
  "group_picture": "https://example.com/pic.jpg",
  "created_by": 1,
  "member_count": 4,
  "members": [
    {
      "id": 1,
      "group_id": 1,
      "user": {
        "id": 1,
        "username": "alice",
        "display_name": "Alice Smith"
      },
      "role": "admin",
      "joined_at": "2025-11-02T08:00:00Z"
    },
    {
      "id": 2,
      "group_id": 1,
      "user": {
        "id": 2,
        "username": "bob",
        "display_name": "Bob Jones"
      },
      "role": "member",
      "joined_at": "2025-11-02T08:00:00Z"
    }
  ],
  "user_role": "admin",
  "created_at": "2025-11-02T08:00:00Z",
  "updated_at": "2025-11-02T08:30:00Z"
}
```

### Add Member to Group (AC3)
```http
POST /api/groups/add-member?group_id=1
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Member added successfully"
}
```

**Business Rules:**
- Any group member can add new members (AC3)
- Can only add your own friends
- Cannot add users already in the group
- New members are added with "member" role

### Leave Group (AC4)
```http
POST /api/groups/leave?group_id=1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Left group successfully"
}
```

**Business Rules:**
- Any member can leave voluntarily (AC4)
- Admin can also leave using this endpoint
- Member is completely removed from group

### Remove Member (AC5 - Admin Only)
```http
DELETE /api/groups/remove-member?group_id=1
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Member removed successfully"
}
```

**Business Rules:**
- Only admins can remove members (AC5)
- Cannot remove yourself (use leave endpoint)
- Returns 403 if requester is not admin
- Returns 404 if member not in group

### Send Group Message
```http
POST /api/groups/send-message?group_id=1
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello everyone!"
}
```

**Response (201 Created):**
```json
{
  "message": {
    "id": 1,
    "group_id": 1,
    "sender_id": 1,
    "content": "Hello everyone!",
    "created_at": "2025-11-02T08:15:00Z"
  }
}
```

### Get Group Messages
```http
GET /api/groups/messages?group_id=1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "group_id": 1,
    "sender_id": 1,
    "sender": {
      "id": 1,
      "username": "alice",
      "display_name": "Alice Smith",
      "profile_picture": "..."
    },
    "content": "Hello everyone!",
    "created_at": "2025-11-02T08:15:00Z"
  }
]
```

## Frontend Components

### CreateGroup Component
**Location:** `frontend/src/components/CreateGroup.tsx`

**Features:**
- ✅ Modal form for creating groups (AC1)
- ✅ Group name input (required) (AC2)
- ✅ Description input (optional) (AC2)
- ✅ Group picture URL input (optional) (AC2)
- ✅ Friend selection with checkboxes (AC1)
- ✅ Validation: minimum 2 members total
- ✅ Only friends can be added
- ✅ Creates group and navigates to group chat

**Usage:**
```tsx
<CreateGroup
  onClose={() => setShowModal(false)}
  onGroupCreated={() => loadGroups()}
/>
```

### Groups Component
**Location:** `frontend/src/components/Groups.tsx`

**Features:**
- Lists all groups user is a member of
- Shows group name, picture, member count
- Displays last message preview
- Admin badge for groups where user is admin
- "Create Group" button
- Click group to open group chat
- Empty state with create button

### GroupChat Component
**Location:** `frontend/src/components/GroupChat.tsx`

**Features:**
- ✅ Group header with name, picture, member count
- ✅ Back button to return to groups list
- ✅ Members panel (expandable) showing all members
- ✅ Add Member button (visible to all members) (AC3)
- ✅ Remove Member button (admin only, next to each member) (AC5)
- ✅ Leave Group button (visible to all members) (AC4)
- ✅ Message display with sender names
- ✅ Differentiated message bubbles (own vs others)
- ✅ Message input and send
- ✅ Auto-scroll to latest messages
- ✅ Polling for new messages (every 3 seconds)
- ✅ Loading and error states

**Member Management UI:**
- Click "Members" icon to expand panel
- Shows all members with role badges
- Admin members have blue "Admin" label
- Non-admin members see "Add Member" button only
- Admin members see both "Add Member" and "Remove" buttons
- "Add Member" shows list of friends not in group
- Click "Add" to add friend to group
- Click "Remove" next to member to remove them (admin only)

### Routes
```tsx
<Route path="groups" element={<Groups />} />
<Route path="group/:groupId" element={<GroupChat />} />
```

### Services

#### groupService.ts
**Location:** `frontend/src/services/groupService.ts`

**Methods:**
- `createGroup(data)` - Create new group
- `getUserGroups()` - Get all user's groups
- `getGroupDetails(groupId)` - Get group with members
- `addGroupMember(groupId, userId)` - Add member (AC3)
- `leaveGroup(groupId)` - Leave group (AC4)
- `removeGroupMember(groupId, userId)` - Remove member (AC5)
- `sendGroupMessage(groupId, content)` - Send message
- `getGroupMessages(groupId)` - Get all messages

## User Flow

### Creating a Group (AC1 & AC2)

1. Navigate to Groups page (sidebar → Groups)
2. Click "Create Group" button
3. Enter group name (required)
4. Optionally enter description
5. Optionally enter group picture URL
6. Select friends to add (minimum 1, making 2 total with you)
7. Click "Create Group"
8. Automatically navigated to the new group chat
9. You are the admin of the group

### Adding Members to Group (AC3)

1. Open a group chat
2. Click the members icon in header
3. Members panel expands
4. Click "+ Add Member" button
5. List of friends not in group appears
6. Click "Add" next to friend's name
7. Friend is added to group
8. Members panel updates

**Note:** Any member can add new members, not just admins (per AC3)

### Leaving a Group (AC4)

1. Open a group chat
2. Click the "Leave Group" icon (exit icon) in header
3. Confirm the action
4. You are removed from the group
5. Automatically redirected to Groups list

### Removing Members (AC5 - Admin Only)

1. Open a group chat (must be admin)
2. Click the members icon in header
3. Members panel expands
4. Find member to remove
5. Click "Remove" button next to their name
6. Confirm the action
7. Member is removed from group
8. Members panel updates

**Note:** Only admins see the "Remove" button

### Sending Messages

1. Open a group chat
2. Type message in input field at bottom
3. Click send button or press Enter
4. Message appears in chat
5. Sender name shown above each message (except your own)
6. Timestamps displayed

## Security Features

- **Authorization:** All endpoints require JWT authentication
- **Friendship verification:** Can only add friends to groups
- **Membership check:** Only members can view/send messages
- **Admin verification:** Remove member requires admin role
- **User ID extraction:** Sender ID from JWT, not request body
- **SQL injection protection:** Parameterized queries
- **Role enforcement:** Admin operations validate user role

## Testing

### Test Scenario 1: Create Group (AC1 & AC2)

1. Log in as User A
2. Navigate to Groups
3. Click "Create Group"
4. Enter name: "Test Group"
5. Select 2 friends (User B and User C)
6. Click "Create Group"
7. **Verify:** Group created successfully
8. **Verify:** You are admin
9. **Verify:** 3 members total
10. **Verify:** Group appears in Groups list

### Test Scenario 2: Add Member (AC3)

1. Log in as User B (regular member, not admin)
2. Open "Test Group"
3. Click members icon
4. Click "+ Add Member"
5. Select User D from list
6. Click "Add"
7. **Verify:** User D added successfully
8. **Verify:** Now 4 members total
9. **Verify:** Non-admin can add members

### Test Scenario 3: Leave Group (AC4)

1. Log in as User C
2. Open "Test Group"
3. Click leave icon
4. Confirm
5. **Verify:** Redirected to Groups list
6. **Verify:** "Test Group" no longer in list
7. Log in as User A
8. Open "Test Group"
9. **Verify:** User C not in members list
10. **Verify:** Now 3 members total

### Test Scenario 4: Remove Member (AC5)

1. Log in as User A (admin)
2. Open "Test Group"
3. Click members icon
4. Find User D
5. **Verify:** "Remove" button visible (admin only)
6. Click "Remove" next to User D
7. Confirm
8. **Verify:** User D removed
9. **Verify:** Now 2 members total
10. Log in as User B (non-admin)
11. Open members panel
12. **Verify:** No "Remove" buttons visible

### Test Scenario 5: Send Messages

1. Log in as User A
2. Open "Test Group"
3. Send message: "Hello group!"
4. **Verify:** Message appears on right (blue bubble)
5. Log in as User B
6. Open "Test Group"
7. **Verify:** User A's message appears on left (gray bubble)
8. **Verify:** "Alice Smith" shown above message
9. Send message: "Hi Alice!"
10. **Verify:** Message appears on right
11. Log in as User A
12. **Verify:** User B's message appears with sender name

## Files Changed/Added

### Backend (4 files)
- ✅ `database/db.go` - Added 3 group tables
- ✅ `models/user.go` - Added group models and requests
- ✅ `handlers/groups.go` - New file with 8 group handlers
- ✅ `routes/router.go` - Added 8 group endpoints

### Frontend (9 files)
- ✅ `types/auth.ts` - Added group types
- ✅ `services/groupService.ts` - New group API service
- ✅ `components/CreateGroup.tsx` - New group creation modal
- ✅ `components/Groups.tsx` - New groups list view
- ✅ `components/GroupChat.tsx` - New group chat interface
- ✅ `components/Dashboard.tsx` - Added group routes
- ✅ `components/Sidebar.tsx` - Added Groups menu item

## Build Status

- ✅ Backend compiles successfully
- ✅ Frontend builds successfully
- ✅ All TypeScript types correct
- ✅ All acceptance criteria implemented
- ✅ All business rules enforced

## Limitations & Future Enhancements

### Current Limitations

1. **Polling-based updates** - Uses 3-second polling instead of real-time WebSockets
2. **Text-only messages** - No file/image attachments in groups
3. **No message editing/deletion** - Messages are permanent
4. **No group settings** - Cannot edit name/description after creation
5. **Single admin** - Only creator is admin, cannot promote others
6. **No group search** - Cannot search within group messages

### Future Enhancements

1. **WebSocket support** for real-time updates
2. **Multiple admins** - Ability to promote/demote members
3. **Edit group details** - Change name, description, picture
4. **Group settings** - Privacy options, join approval
5. **Message features** - Edit, delete, reply, reactions
6. **Rich media** - Images, files, voice messages
7. **Member permissions** - Custom role permissions
8. **Group notifications** - Mute, custom alerts
9. **Group analytics** - Activity stats, member insights
10. **Export chat** - Download conversation history

## Conclusion

The group chat feature is fully functional with all 5 acceptance criteria successfully implemented:

- ✅ AC1: Users can create groups with 2+ friends
- ✅ AC2: Group name and picture can be set
- ✅ AC3: All members can add new members
- ✅ AC4: Members can voluntarily leave
- ✅ AC5: Admins can remove members

The implementation provides a solid foundation for group communication while maintaining security through proper authorization and role-based access control.
