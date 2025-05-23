import { Link, useLocation } from 'react-router-dom';
import { Music4, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';

const Header = () => {
  const location = useLocation();
  const isEventPage = location.pathname.includes('/event/') || location.pathname.includes('/guest/');
  const user = useEventStore((state) => state.user);
  
  return (
    <header className="glass-panel border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
            className="relative w-10 h-10"
          >
            <img 
              src="/src/assets/icons/ij-icon.png"
              alt="IJ Logo"
              className="w-full h-full object-contain glow"
            />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-neon-magenta via-neon-purple to-neon-cyan bg-clip-text text-transparent">
            IJ
          </span>
        </Link>
        
        {isEventPage && (
          <div className="flex space-x-1 items-center bg-dark-700/40 px-3 py-1 rounded-full border border-white/10">
            <span className="animate-pulse h-2 w-2 rounded-full bg-neon-magenta"></span>
            <span className="text-sm text-gray-300">Live Event</span>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          {!isEventPage && !location.pathname.includes('/login') && (
            <Link to="/create" className="glass-button text-sm">
              Host an Event
            </Link>
          )}
          
          {user && (
            <Link 
              to="/me"
              className={`p-2 rounded-full ${
                location.pathname === '/me' 
                  ? 'bg-neon-magenta text-white' 
                  : 'bg-dark-700/40 text-gray-300 hover:bg-dark-700'
              }`}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={20} />
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;