import axios from 'axios';
import { getAuthToken, clearAuth } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  provider: string;
  can_host: boolean;
}

export interface Event {
  id: string;
  name: string;
  host_id: string;
  created_at: string;
  energy: number;
  date: string;
  mood: string;
  genres: string[];
  eras: string[];
  provider: string;
}

export interface AuthResponse {
  redirectUrl: string;
  token?: string;
}

// Auth API
export const authApi = {
  getCurrentUser: () => api.get<User>('/api/auth/me'),
  
  loginWithSpotify: () => {
    window.location.href = '/api/auth/spotify/start';
  },
  
  loginWithYouTube: () => {
    window.location.href = '/api/auth/youtube/start';
  },
  
  loginWithApple: () => {
    window.location.href = '/api/auth/apple/start';
  },

  logout: () => {
    clearAuth();
    return api.post('/auth/logout');
  }
};

// Events API
export const eventsApi = {
  createEvent: (data: { 
    name: string; 
    date: string;
    mood: string;
    genres: string[];
    eras: string[];
    energy: number;
  }) => api.post<Event>('/api/events', data),
  
  getEvent: (id: string) => 
    api.get<Event>(`/events/${id}`),
  
  updateEvent: (id: string, data: Partial<Event>) => 
    api.put<Event>(`/events/${id}`, data),
  
  deleteEvent: (id: string) => 
    api.delete(`/events/${id}`),
  
  setEnergy: (id: string, energy: number) => 
    api.post<Event>(`/events/${id}/controls/set-energy`, { energy }),
};

// Users API
export const usersApi = {
  getProfile: () => 
    api.get<User>('/users'),
  
  updateProfile: (data: Partial<User>) => 
    api.post<User>('/api/users/upgrade'),
  
  checkHostStatus: () => 
    api.get<{ canHost: boolean }>('api/users/can-host'),
};

// Export all APIs
export default {
  auth: authApi,
  events: eventsApi,
  users: usersApi,
};

export const getProfile = async () => {
  const response = await api.get('/api/profile/me');
  return response.data.profile;
};

export const updateProfile = async (profileData: any) => {
  const response = await api.put('/api/profile/me', profileData);
  return response.data.profile;
};

// In browser console
console.log('Current token:', localStorage.getItem('auth_token')); 