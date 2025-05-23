import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[200px]">
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-12 h-12 rounded-full border-4 border-t-neon-magenta border-r-neon-purple border-b-neon-cyan border-l-transparent"
      />
    </div>
  );
};

export default LoadingSpinner;