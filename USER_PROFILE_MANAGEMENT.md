# User Profile Management - UMP-01 & UMP-02

## Overview
Implemented comprehensive user profile management features including profile creation, editing, viewing, and friend management system.

## User Stories Completed

### UMP-01: Create and Edit Profile ✅
**As a user, I want to set up and update my profile information, so that other users can identify me.**

#### Acceptance Criteria:
- ✅ **AC1**: User must set a unique, non-editable username (@john.doe)
  - Username is set during registration
  - Cannot be changed after account creation
  - Shown as read-only in profile edit
  
- ✅ **AC2**: User can set and change their display name
  - Display name field in edit profile
  - Max 100 characters
  - Optional field
  - Updates in real-time

- ✅ **AC3**: User can upload and change their profile picture
  - Image upload via file picker
  - Base64 encoding for storage
  - Max 2MB file size
  - Instant preview
  - Stored in database

- ✅ **AC4**: User can write and edit a short bio or status message
  - Bio/status field in edit profile
  - Max 500 characters
  - Multiline textarea
  - Character counter

### UMP-02: View User Profiles ✅
**As a user, I want to view the profiles of other users, so that I can learn more about them before connecting.**

#### Acceptance Criteria:
- ✅ **AC1**: Tapping on a user's name or picture opens their profile page
  - UserProfileView component
  - Accessible via user ID or username
  - Modal overlay design

- ✅ **AC2**: The profile page displays their picture, display name, username, and bio
  - Profile picture with fallback to initials
  - Display name (or username if not set)
  - Username with @ prefix
  - Bio/status message
  - Verification badge
  - Join date

- ✅ **AC3**: The profile page shows the connection status
  - "Friend" button for accepted friendships
  - "Friend Request Sent" for pending outgoing requests
  - "Add Friend" button for non-friends
  - "Remove Friend" option for existing friends

## Database Schema

### Users Table (Updated)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,              -- AC1: Unique, non-editable
    display_name TEXT,                          -- AC2: Changeable display name
    bio TEXT,                                   -- AC4: Status/bio message
    profile_picture TEXT,                       -- AC3: Base64 image data
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Friendships Table (New)
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

## Backend Implementation

### New Files Created

#### 1. `handlers/profile.go` (395 lines)
Profile management handlers:
- `GetMyProfile()` - Get authenticated user's profile
- `UpdateProfile()` - Update display name and bio
- `UploadProfilePicture()` - Upload profile picture (base64)
- `GetUserProfile()` - Get any user's public profile
- `SearchUsers()` - Search users by username/display name

#### 2. `handlers/friends.go` (348 lines)
Friend management handlers:
- `SendFriendRequest()` - Send friend request
- `RespondToFriendRequest()` - Accept/reject friend request
- `GetFriendRequests()` - Get pending requests
- `GetFriends()` - Get list of friends
- `RemoveFriend()` - Remove a friend

### Updated Files

#### 1. `models/user.go`
Added new types:
- `UserProfile` - Public profile view
- `UpdateProfileRequest` - Profile update request
- `FriendRequest` - Friend request data
- `FriendRequestResponse` - Friend request with user data
- `ProfileResponse` - Profile API response

#### 2. `routes/router.go`
New endpoints:
```go
// Profile endpoints (protected)
/api/profile/me              GET    - Get my profile
/api/profile/update          PUT    - Update profile
/api/profile/upload-picture  POST   - Upload profile picture
/api/profile/user            GET    - Get user profile (by ID or username)
/api/profile/search          GET    - Search users

// Friend endpoints (protected)
/api/friends                 GET    - Get friends list
/api/friends/requests        GET    - Get friend requests
/api/friends/send            POST   - Send friend request
/api/friends/respond         POST   - Accept/reject request
/api/friends/remove          DELETE - Remove friend
```

## Frontend Implementation

### New Components

#### 1. `EditProfile.tsx` (290 lines)
Profile editing modal:
- Display name input (max 100 chars)
- Bio textarea (max 500 chars)
- Profile picture upload
- Image preview
- Real-time character counters
- Username shown as read-only
- Success/error messaging
- Responsive design

**Features:**
- File picker for images
- Image validation (type & size)
- Base64 encoding
- Instant upload feedback
- Local storage update
- Dark mode support

#### 2. `UserProfileView.tsx` (260 lines)
User profile viewer modal:
- Profile picture display
- Display name / username
- Verification badge
- Bio/status message
- Stats (friends, join date)
- Friend action buttons
- Dynamic status display
- Error handling

**Friend Status Options:**
- None → "Add Friend" button
- Pending (sent) → "Friend Request Sent" (disabled)
- Pending (received) → Info message
- Friend → "Remove Friend" button

### New Services

#### `profileService.ts` (210 lines)
API integration for:
- Profile CRUD operations
- Image upload
- User search
- Friend management
- Request handling

All methods include:
- JWT authentication
- Error handling
- Type safety
- Local storage sync

### Updated Components

#### `SettingsPanel.tsx`
Added:
- Edit Profile button
- EditProfile modal integration
- Profile refresh on update

#### `types/auth.ts`
Extended with:
- `UserProfile` interface
- `UpdateProfileRequest` interface
- `FriendRequest` interface
- `FriendRequestResponse` interface

## Features

### Profile Management
1. **Username**
   - Set during registration
   - Permanent and unique
   - Format: alphanumeric, underscore, hyphen
   - Shown with @ prefix

2. **Display Name**
   - Optional custom name
   - Max 100 characters
   - Fallback to username
   - Editable anytime

3. **Profile Picture**
   - Image upload support
   - Max 2MB size limit
   - Base64 storage
   - Fallback to initials
   - Instant preview

4. **Bio/Status**
   - Optional message
   - Max 500 characters
   - Multiline support
   - Editable anytime

### Friend System
1. **Send Requests**
   - One-way request
   - Prevents duplicates
   - Self-request protection

2. **Respond to Requests**
   - Accept or reject
   - Only recipient can respond
   - Updates immediately

3. **View Friends**
   - List all accepted friends
   - Friend count
   - Profile links

4. **Remove Friends**
   - Confirmation required
   - Updates status
   - Reversible action

### User Search
- Search by username or display name
- Minimum 2 characters
- Max 20 results
- Shows verified users only
- Real-time results

## API Endpoints

### Profile Endpoints

#### GET /api/profile/me
Get authenticated user's full profile.

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john.doe",
  "display_name": "John Doe",
  "bio": "Software developer",
  "profile_picture": "data:image/png;base64,...",
  "is_verified": true,
  "created_at": "2025-11-01T00:00:00Z",
  "updated_at": "2025-11-01T00:00:00Z"
}
```

#### PUT /api/profile/update
Update profile information.

**Request:**
```json
{
  "display_name": "John Doe",
  "bio": "Software developer"
}
```

#### POST /api/profile/upload-picture
Upload profile picture.

**Request:**
```json
{
  "image": "data:image/png;base64,..."
}
```

#### GET /api/profile/user?user={id|username}
Get user's public profile.

**Response:**
```json
{
  "profile": {
    "id": 2,
    "username": "jane.doe",
    "display_name": "Jane Doe",
    "bio": "Designer",
    "profile_picture": "data:image/png;base64,...",
    "is_verified": true,
    "created_at": "2025-11-01T00:00:00Z",
    "friend_status": "friend"
  }
}
```

#### GET /api/profile/search?q={query}
Search users.

**Response:**
```json
[
  {
    "id": 2,
    "username": "jane.doe",
    "display_name": "Jane Doe",
    "bio": "Designer",
    "is_verified": true,
    "created_at": "2025-11-01T00:00:00Z"
  }
]
```

### Friend Endpoints

#### POST /api/friends/send
Send friend request.

**Request:**
```json
{
  "friend_id": 2
}
```

#### POST /api/friends/respond
Accept or reject friend request.

**Request:**
```json
{
  "friend_id": 2,
  "action": "accept"
}
```

#### GET /api/friends/requests
Get pending friend requests (received).

#### GET /api/friends
Get list of friends.

#### DELETE /api/friends/remove
Remove a friend.

**Request:**
```json
{
  "friend_id": 2
}
```

## Security Features

1. **Authentication**
   - All endpoints require JWT
   - Token validation
   - User context injection

2. **Authorization**
   - Users can only edit own profile
   - Friend status validation
   - Self-request prevention

3. **Validation**
   - Display name: max 100 chars
   - Bio: max 500 chars
   - Image: max 2MB, image types only
   - Username: permanent, validated at registration

4. **Data Protection**
   - Email hidden in public profiles
   - Password never returned
   - Friendship status private

## User Experience

### Edit Profile Flow
1. Click "Edit Profile" in settings
2. Modal opens with current data
3. Upload new picture (optional)
4. Update display name (optional)
5. Update bio (optional)
6. Click "Save Changes"
7. Success message shown
8. Modal closes, data refreshes

### View Profile Flow
1. Click on user's name/picture
2. Profile modal opens
3. View user information
4. See friend status
5. Take action (add/remove friend)
6. Close modal

### Add Friend Flow
1. View user's profile
2. Click "Add Friend"
3. Request sent confirmation
4. Button changes to "Request Sent"
5. Other user receives notification
6. Accept/reject in requests page

## Database Migration

For existing databases:
```sql
-- Add profile fields
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_picture TEXT;

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
```

## Testing

### Manual Testing Checklist

#### Profile Management
- [ ] Edit profile opens correctly
- [ ] Display name updates
- [ ] Bio updates
- [ ] Profile picture uploads
- [ ] Character counters work
- [ ] Validation messages show
- [ ] Username is read-only
- [ ] Changes persist after refresh

#### Profile Viewing
- [ ] Profile opens via user ID
- [ ] Profile opens via username
- [ ] All fields display correctly
- [ ] Fallback to initials works
- [ ] Friend status shows correctly
- [ ] Join date formats properly

#### Friend System
- [ ] Send request works
- [ ] Can't send to self
- [ ] Can't send duplicate
- [ ] Accept request works
- [ ] Reject request works
- [ ] Remove friend works
- [ ] Confirmation shows
- [ ] Status updates immediately

#### Search
- [ ] Finds users by username
- [ ] Finds users by display name
- [ ] Min 2 chars enforced
- [ ] Max 20 results shown
- [ ] Only verified users shown

## Future Enhancements

1. **Profile Features**
   - Cover photo
   - Profile themes
   - Privacy settings
   - Online status
   - Last seen

2. **Friend Features**
   - Block users
   - Friend suggestions
   - Mutual friends
   - Friend categories
   - Favorites

3. **Social Features**
   - Profile views counter
   - Activity feed
   - Posts/status updates
   - Profile badges
   - Achievements

4. **Media**
   - Photo gallery
   - Video uploads
   - Voice notes
   - File storage

5. **Search**
   - Advanced filters
   - Location search
   - Interest matching
   - Nearby users

## Known Limitations

1. Profile pictures stored as base64 (not optimal for large scale)
2. No image cropping/resizing
3. No friend request notifications
4. No mutual friend count
5. No profile view analytics

## Production Considerations

1. **Image Storage**
   - Consider CDN for profile pictures
   - Implement image optimization
   - Add multiple size variants
   - Cache profile images

2. **Performance**
   - Pagination for friends list
   - Lazy loading for images
   - Cache user profiles
   - Index optimization

3. **Security**
   - Rate limiting on uploads
   - Image content validation
   - Spam prevention
   - Privacy controls

4. **Scalability**
   - Separate image service
   - Database sharding
   - Cache layer
   - Queue system for processing

## Conclusion

Both user stories UMP-01 and UMP-02 are fully implemented with all acceptance criteria met. The system provides a complete profile management experience with friend functionality, all secured with JWT authentication and following best practices for validation and error handling.
