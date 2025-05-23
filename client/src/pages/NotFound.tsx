import { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon } from 'lucide-react';

const NotFound: FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <motion.h1 
        className="text-6xl md:text-8xl font-bold neon-gradient mb-4"
        animate={{ 
          textShadow: [
            "0 0 5px rgba(255,0,255,0.5), 0 0 10px rgba(255,0,255,0.3)", 
            "0 0 15px rgba(255,0,255,0.7), 0 0 20px rgba(255,0,255,0.5)",
            "0 0 5px rgba(255,0,255,0.5), 0 0 10px rgba(255,0,255,0.3)"
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
      >
        404
      </motion.h1>
      <p className="text-xl mb-8 text-gray-300">The beat has dropped elsewhere...</p>
      <Link 
        to="/"
        className="neon-button neon-button-gradient inline-flex items-center space-x-2"
      >
        <HomeIcon size={18} />
        <span>Back to the party</span>
      </Link>
    </motion.div>
  );
};

export default NotFound;