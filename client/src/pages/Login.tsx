import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

const providers = [
  { 
    id: 'spotify', 
    name: 'Spotify', 
    color: 'from-[#1DB954] to-[#1ed760]',
    shadowColor: 'rgba(29, 185, 84, 0.3)',
    login: authApi.loginWithSpotify
  },
  { 
    id: 'youtube', 
    name: 'YouTube Music', 
    color: 'from-[#FF0000] to-[#ff4444]',
    shadowColor: 'rgba(255, 0, 0, 0.3)',
    login: authApi.loginWithYouTube
  },
  { 
    id: 'apple', 
    name: 'Apple Music', 
    color: 'from-[#FC3C44] to-[#ff4b52]',
    shadowColor: 'rgba(252, 60, 68, 0.3)',
    login: authApi.loginWithApple
  }
];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check for auth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      setError('Authentication failed. Please try again.');
      return;
    }
    
    if (token) {
      localStorage.setItem('token', token);
      const from = location.state?.from?.pathname || "/"; 
      navigate(from);
    }

    // Check if we're already authenticated
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [navigate]);

  const handleLogin = async (providerId: string) => {
    try {
      setLoading(providerId);
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        await provider.login();
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700"
        style={{
          backgroundPosition: `${50 + mousePosition.x * 10}% ${50 + mousePosition.y * 10}%`
        }}
      />

      {/* Logo and title */}
      <motion.div 
        className="text-center mb-12 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-4"
        >
          <img 
            src="/src/assets/icons/ij-icon.png"
            alt="IJ Logo"
            className="w-24 h-24 object-contain glow floating"
          />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-2">Welcome to IJ DJ</h1>
        <p className="text-gray-400">Sign in to start creating amazing playlists</p>
      </motion.div>

      {/* Login buttons */}
      <motion.div 
        className="relative w-full max-w-sm space-y-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm mb-4"
          >
            {error}
          </motion.div>
        )}
        
        {providers.map((provider, index) => (
          <motion.button
            key={provider.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: `0 0 20px ${provider.shadowColor}`,
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin(provider.id)}
            disabled={loading !== null}
            className={`
              w-full py-4 px-6 rounded-xl 
              bg-gradient-to-r ${provider.color}
              text-white font-medium
              transition-all duration-200
              disabled:opacity-70 disabled:cursor-not-allowed
              relative overflow-hidden group
            `}
          >
            <div className={`
              absolute inset-0 
              bg-gradient-to-r ${provider.color}
              opacity-0 group-hover:opacity-30 
              transition-opacity duration-300
            `} />
            
            {loading === provider.id ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              <span className="relative z-10">Continue with {provider.name}</span>
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-8 text-center text-sm text-gray-500 z-10"
      >
        By continuing, you agree to our Terms of Service and Privacy Policy
      </motion.div>
    </div>
  );
};

export default Login;