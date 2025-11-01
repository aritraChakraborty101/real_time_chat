import { User, UserProfile, UpdateProfileRequest, SuccessResponse, FriendRequestResponse } from '../types/auth';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export const profileService = {
  async getMyProfile(): Promise<User> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch profile');
    }

    return responseData;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to update profile');
    }

    // Update stored user data
    localStorage.setItem('user', JSON.stringify(responseData));

    return responseData;
  },

  async uploadProfilePicture(imageData: string): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/upload-picture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image: imageData }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to upload profile picture');
    }

    return responseData;
  },

  async getUserProfile(identifier: string | number): Promise<{ profile: UserProfile }> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/user?user=${identifier}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch user profile');
    }

    return responseData;
  },

  async searchUsers(query: string): Promise<UserProfile[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to search users');
    }

    return responseData;
  },

  async sendFriendRequest(friendId: number): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/friends/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_id: friendId }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to send friend request');
    }

    return responseData;
  },

  async respondToFriendRequest(friendId: number, action: 'accept' | 'reject'): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/friends/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_id: friendId, action }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to respond to friend request');
    }

    return responseData;
  },

  async getFriendRequests(): Promise<FriendRequestResponse[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/friends/requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch friend requests');
    }

    return responseData;
  },

  async getFriends(): Promise<UserProfile[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/friends`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch friends');
    }

    return responseData;
  },

  async removeFriend(friendId: number): Promise<SuccessResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/friends/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_id: friendId }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to remove friend');
    }

    return responseData;
  },
};
