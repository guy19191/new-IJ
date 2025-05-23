import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VolumeX, Volume2, ThumbsUp, ThumbsDown, Music, Headphones, Wand2 } from 'lucide-react';

type Emotion = 'neutral' | 'happy' | 'sad' | 'excited' | 'thoughtful';
type Message = { text: string; duration: number };

interface LyraAvatarProps {
  energyLevel: number;
  isPlaying: boolean;
}

const LyraAvatar: React.FC<LyraAvatarProps> = ({ energyLevel, isPlaying }) => {
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [message, setMessage] = useState<Message | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHologram, setShowHologram] = useState(false);

  // Update emotion based on energy level
  useEffect(() => {
    if (energyLevel > 80) {
      setEmotion('excited');
    } else if (energyLevel > 60) {
      setEmotion('happy');
    } else if (energyLevel > 40) {
      setEmotion('neutral');
    } else if (energyLevel > 20) {
      setEmotion('thoughtful');
    } else {
      setEmotion('sad');
    }
  }, [energyLevel]);

  // Simulate Lyra AI messages
  useEffect(() => {
    const messages = [
      { text: "I'm sensing great energy from this track! 🎵", duration: 4000 },
      { text: "Let's switch up the tempo next. Ready for something more upbeat! 🚀", duration: 4000 },
      { text: "The crowd is loving this vibe! Keep it going! ✨", duration: 3500 },
      { text: "I've got some amazing tracks lined up next! 🎧", duration: 3500 },
      { text: "Time to take the energy up a notch! 🔥", duration: 3500 }
    ];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6 && isPlaying) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setMessage(randomMessage);
        
        setTimeout(() => {
          setMessage(null);
        }, randomMessage.duration);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getEmotionColor = () => {
    switch (emotion) {
      case 'happy': return 'bg-neon-cyan';
      case 'excited': return 'bg-neon-magenta';
      case 'sad': return 'bg-blue-500';
      case 'thoughtful': return 'bg-neon-purple';
      default: return 'bg-white';
    }
  };

  const getEmotionIcon = () => {
    switch (emotion) {
      case 'happy': return <ThumbsUp size={24} />;
      case 'excited': return <Wand2 size={24} />;
      case 'sad': return <ThumbsDown size={24} />;
      case 'thoughtful': return <Headphones size={24} />;
      default: return <Music size={24} />;
    }
  };

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-20`}>
      <AnimatePresence>
        {!isMinimized && message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="glass-panel p-4 mb-3 max-w-xs backdrop-blur-lg border border-neon-magenta/30"
          >
            <p className="text-sm">{message.text}</p>
            
            {/* Animated circuit lines */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] overflow-hidden">
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="h-full w-full bg-gradient-to-r from-transparent via-neon-magenta to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsMinimized(!isMinimized);
          setShowHologram(true);
        }}
        className={`relative cursor-pointer ${
          isMinimized ? 'h-12 w-12' : 'h-16 w-16 md:h-20 md:w-20'
        } rounded-full flex items-center justify-center transition-all duration-300`}
      >
        {/* Lyra's hologram */}
        <AnimatePresence>
          {showHologram && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-48 right-0"
            >
              <div className="relative w-40 h-40">
                <img
                  src="/src/assets/icons/lyra.png"
                  alt="Lyra AI"
                  className="w-full h-full object-cover rounded-xl"
                />
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="absolute inset-0 bg-gradient-to-t from-neon-magenta/30 to-neon-cyan/30 rounded-xl"
                />
                
                {/* Holographic scanlines */}
                <motion.div
                  animate={{
                    y: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"
                  style={{ mixBlendMode: 'overlay' }}
                />
                
                {/* Circuit patterns */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <motion.div
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 30% 30%, rgba(255,0,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(0,255,255,0.1) 0%, transparent 50%)
                      `,
                      backgroundSize: '200% 200%',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Background circle with pulse */}
        <div className={`absolute inset-0 rounded-full ${getEmotionColor()} opacity-20`}></div>
        
        {/* Border circle with animation */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 0 4px ${emotion === 'excited' ? 'rgba(255,0,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              `0 0 0 8px ${emotion === 'excited' ? 'rgba(255,0,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              `0 0 0 4px ${emotion === 'excited' ? 'rgba(255,0,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full ${getEmotionColor()} opacity-40`}
        ></motion.div>
        
        {/* Inner circle with icon */}
        <div className="glass-panel h-full w-full rounded-full flex items-center justify-center border-2 border-white/20 relative overflow-hidden">
          {/* Animated background */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(255,0,255,0.2), transparent)',
              backgroundSize: '200% 200%',
            }}
          />
          
          <motion.div
            animate={{ 
              scale: isPlaying ? [1, 1.05, 1] : 1,
              rotate: isPlaying ? [0, 5, -5, 0] : 0,
            }}
            transition={{ 
              duration: 1.5, 
              repeat: isPlaying ? Infinity : 0,
              repeatType: "reverse"
            }}
            className="text-white relative z-10"
          >
            {isPlaying ? getEmotionIcon() : <VolumeX size={24} />}
          </motion.div>
        </div>
        
        {/* Status indicator */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neon-cyan border border-dark-800"
        />
      </motion.div>
    </div>
  );
};

export default LyraAvatar;