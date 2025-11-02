import { 
  GroupWithDetails, 
  CreateGroupRequest, 
  AddGroupMemberRequest, 
  GroupMessage,
  SendGroupMessageRequest,
  GroupMessageResponse,
  SuccessResponse 
} from '../types/auth';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export const groupService = {
  async createGroup(data: CreateGroupRequest): Promise<GroupWithDetails> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to create group');
    }

    return responseData;
  },

  async getUserGroups(): Promise<GroupWithDetails[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch groups');
    }

    return responseData;
  },

  async getGroupDetails(groupId: number): Promise<GroupWithDetails> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/details?group_id=${groupId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch group details');
    }

    return responseData;
  },

  async addGroupMember(groupId: number, userId: number): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/add-member?group_id=${groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId } as AddGroupMemberRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to add member');
    }

    return responseData;
  },

  async leaveGroup(groupId: number): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/leave?group_id=${groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to leave group');
    }

    return responseData;
  },

  async removeGroupMember(groupId: number, userId: number): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/remove-member?group_id=${groupId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId } as AddGroupMemberRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to remove member');
    }

    return responseData;
  },

  async sendGroupMessage(groupId: number, content: string): Promise<GroupMessageResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/send-message?group_id=${groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content } as SendGroupMessageRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to send message');
    }

    return responseData;
  },

  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/groups/messages?group_id=${groupId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch messages');
    }

    return responseData;
  },
};
