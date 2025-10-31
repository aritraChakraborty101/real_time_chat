import { RegisterRequest, LoginRequest, AuthResponse, SuccessResponse } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export const authService = {
  async register(data: RegisterRequest): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Registration failed');
    }

    return responseData;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Login failed');
    }

    // Store token in localStorage
    if (responseData.token) {
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(responseData.user));
    }

    return responseData;
  },

  async verifyEmail(token: string): Promise<SuccessResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
      method: 'GET',
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Verification failed');
    }

    return responseData;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
