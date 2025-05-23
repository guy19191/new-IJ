import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, User } from '../services/api';
import { getAuthToken, clearAuth } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate('/login');
  }, [navigate]);


  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    checkAuth
  };
}; 