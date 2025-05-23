export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  return !!token;
};

export const getUserData = () => {
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const setAuthData = (token: string, userData: any) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
};

export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}; 