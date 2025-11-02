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
  status: string; // "sent", "delivered", "read"
  is_deleted: boolean;
  deleted_for_everyone: boolean;
  is_edited: boolean;
  edited_at?: string;
  reply_to_message_id?: number;
  reply_to_message?: Message;
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
  is_muted: boolean;
}

export interface SendMessageRequest {
  recipient_id: number;
  content: string;
  reply_to_message_id?: number;
}

export interface MessageResponse {
  message: Message;
}

export interface SearchMessagesRequest {
  query: string;
}

export interface SearchMessagesResponse {
  results: MessageSearchResult[];
}

export interface MessageSearchResult {
  message: Message;
  conversation_id?: number;
  group_id?: number;
  other_user?: UserProfile;
  group?: Group;
}

export interface MuteConversationRequest {
  conversation_id?: number;
  group_id?: number;
  mute: boolean;
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
  status: string; // "sent", "delivered", "read"
  is_deleted: boolean;
  deleted_for_everyone: boolean;
  is_edited: boolean;
  edited_at?: string;
  reply_to_message_id?: number;
  reply_to_message?: GroupMessage;
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
  is_muted: boolean;
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

export interface UpdateMessageStatusRequest {
  message_ids: number[];
  status: string; // "delivered" or "read"
}

export interface TypingStatusResponse {
  is_typing: boolean;
  user_id: number;
}

export interface DeleteMessageRequest {
  message_id: number;
  delete_for_everyone: boolean;
}

export interface EditMessageRequest {
  message_id: number;
  new_content: string;
}

