import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const userData = searchParams.get('user');
      const error = searchParams.get('error');
      const provider = location.pathname.split('/')[2] as 'spotify' | 'apple' | 'youtube';

      if (error) {
        console.error(`${provider} auth error:`, error);
        setError(error);
        setLoading(false);
        return;
      }

      if (token && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          // Store auth data in localStorage
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(user));
          console.log(`${provider} auth successful:`, { user, token });
          
          // Redirect to create page
          navigate('/');
        } catch (err: any) {
          console.error('Failed to process authentication data:', err);
          setError('Failed to process authentication data');
          setLoading(false);
        }
        return;
      }

      // If we get here, something went wrong
      console.error('Missing token or user data');
      setError('Authentication failed');
      setLoading(false);
    };

    handleCallback();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Completing Authentication...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
} 