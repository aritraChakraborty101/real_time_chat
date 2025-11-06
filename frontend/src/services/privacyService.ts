import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export interface PrivacySettings {
  id: number;
  user_id: number;
  profile_picture_visibility: 'everyone' | 'friends' | 'nobody';
  last_seen_visibility: 'everyone' | 'friends' | 'nobody';
  created_at: string;
  updated_at: string;
}

export interface UpdatePrivacySettingsRequest {
  profile_picture_visibility: 'everyone' | 'friends' | 'nobody';
  last_seen_visibility: 'everyone' | 'friends' | 'nobody';
}

export const privacyService = {
  async getPrivacySettings(): Promise<PrivacySettings> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/privacy/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch privacy settings');
    }

    return responseData;
  },

  async updatePrivacySettings(data: UpdatePrivacySettingsRequest): Promise<PrivacySettings> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/privacy/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to update privacy settings');
    }

    return responseData;
  },
};
