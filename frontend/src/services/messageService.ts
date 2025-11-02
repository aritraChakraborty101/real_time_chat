import { Message, ConversationWithUser, SendMessageRequest, MessageResponse } from '../types/auth';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export const messageService = {
  async sendMessage(recipientId: number, content: string): Promise<MessageResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ recipient_id: recipientId, content } as SendMessageRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to send message');
    }

    return responseData;
  },

  async getConversations(): Promise<ConversationWithUser[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch conversations');
    }

    return responseData;
  },

  async getMessages(friendId: number): Promise<Message[]> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages?friend_id=${friendId}`, {
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
