import { Message, ConversationWithUser, SendMessageRequest, MessageResponse, UpdateMessageStatusRequest, TypingStatusResponse, DeleteMessageRequest, EditMessageRequest } from '../types/auth';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export const messageService = {
  async sendMessage(recipientId: number, content: string, replyToMessageId?: number): Promise<MessageResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        recipient_id: recipientId, 
        content,
        reply_to_message_id: replyToMessageId 
      } as SendMessageRequest),
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

  async markConversationAsRead(friendId: number): Promise<void> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/mark-read?friend_id=${friendId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to mark messages as read');
    }
  },

  async updateTypingStatus(friendId: number, isTyping: boolean): Promise<void> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/typing?friend_id=${friendId}&is_typing=${isTyping}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to update typing status');
    }
  },

  async getTypingStatus(friendId: number): Promise<TypingStatusResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/typing-status?friend_id=${friendId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch typing status');
    }

    return responseData;
  },

  async deleteMessage(messageId: number, deleteForEveryone: boolean): Promise<void> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message_id: messageId, 
        delete_for_everyone: deleteForEveryone 
      } as DeleteMessageRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to delete message');
    }
  },

  async editMessage(messageId: number, newContent: string): Promise<MessageResponse> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/messages/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message_id: messageId, 
        new_content: newContent 
      } as EditMessageRequest),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to edit message');
    }

    return responseData;
  },
};
