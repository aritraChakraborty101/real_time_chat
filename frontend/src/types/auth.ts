export interface User {
  id: number;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_picture?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  display_name?: string;
  bio?: string;
  profile_picture?: string;
  is_verified: boolean;
  created_at: string;
  friend_status?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  message: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  display_name: string;
  bio: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface FriendRequest {
  friend_id: number;
}

export interface FriendRequestResponse {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  friend: UserProfile;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithUser {
  id: number;
  other_user: UserProfile;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

export interface SendMessageRequest {
  recipient_id: number;
  content: string;
}

export interface MessageResponse {
  message: Message;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  group_picture?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: string;
  joined_at: string;
}

export interface GroupMemberWithUser {
  id: number;
  group_id: number;
  user: UserProfile;
  role: string;
  joined_at: string;
}

export interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  sender?: UserProfile;
  content: string;
  created_at: string;
}

export interface GroupWithDetails {
  id: number;
  name: string;
  description?: string;
  group_picture?: string;
  created_by: number;
  member_count: number;
  members?: GroupMemberWithUser[];
  last_message?: GroupMessage;
  user_role?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  group_picture: string;
  member_ids: number[];
}

export interface AddGroupMemberRequest {
  user_id: number;
}

export interface UpdateGroupRequest {
  name: string;
  description: string;
  group_picture: string;
}

export interface SendGroupMessageRequest {
  content: string;
}

export interface GroupMessageResponse {
  message: GroupMessage;
}

