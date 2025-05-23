import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, Music } from 'lucide-react';
import { Track } from '../../store/eventStore';

interface NowPlayingProps {
  track: Track | null;
  isHost: boolean;
  votes: { likes: number; dislikes: number };
}

const NowPlaying: React.FC<NowPlayingProps> = ({ track, isHost, votes }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Simulate playback progress
  useEffect(() => {
    if (!track || !isPlaying) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (track.duration * 10)); // Update every 100ms
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [track, isPlaying]);
  
  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [track]);
  
  if (!track) {
    return (
      <div className="glass-panel p-6 flex items-center justify-center h-40">
        <div className="text-center">
          <Music className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-400">No track currently playing</p>
        </div>
      </div>
    );
  }
  
  // Calculate votes percentage
  const totalVotes = votes.likes + votes.dislikes;
  const likePercentage = totalVotes > 0 ? Math.round((votes.likes / totalVotes) * 100) : 0;
  
  return (
    <div className="glass-panel p-4 md:p-6 relative overflow-hidden">
      {/* Background animated waveform */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <motion.div
          animate={{
            backgroundPositionX: ["0%", "100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 bg-gradient-to-br from-neon-magenta/20 via-neon-purple/20 to-neon-cyan/20"
          style={{
            backgroundSize: "1000% 1000%",
          }}
        ></motion.div>
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Album art with animated ring */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
            <motion.div
              animate={{ 
                rotate: isPlaying ? 360 : 0,
                borderColor: [
                  'rgba(255, 0, 255, 0.6)',
                  'rgba(153, 0, 255, 0.6)',
                  'rgba(0, 255, 255, 0.6)',
                  'rgba(153, 0, 255, 0.6)',
                  'rgba(255, 0, 255, 0.6)',
                ]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                borderColor: { duration: 10, repeat: Infinity, ease: "linear" }
              }}
              className="absolute inset-0 rounded-full border-4 border-neon-magenta"
              style={{ boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)' }}
            ></motion.div>
            
            <div className="absolute inset-2 rounded-full bg-dark-900 flex items-center justify-center overflow-hidden">
              <img 
                src={track.albumArt} 
                alt={`${track.title} album art`} 
                className="h-full w-full object-cover rounded-full" 
              />
            </div>
            
            {/* Center hole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-dark-900 rounded-full border border-white/10"></div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{track.title}</h2>
            <p className="text-gray-300 mb-4">{track.artist}</p>
            
            {/* Track progress */}
            <div className="w-full mb-4">
              <div className="w-full bg-dark-700/60 rounded-full h-1.5">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-neon-magenta via-neon-purple to-neon-cyan h-1.5 rounded-full"
                ></motion.div>
              </div>
            </div>
            
            {isHost ? (
              <div className="flex items-center justify-center md:justify-start space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-full bg-neon-magenta text-white"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-dark-700 text-white"
                >
                  <SkipForward size={18} />
                </motion.button>
                
                <div className="flex items-center ml-2 px-3 py-1 bg-dark-700/60 rounded-full text-sm">
                  <Volume2 size={14} className="mr-1.5 text-gray-400" />
                  <span>Live</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <div className="flex items-center space-x-1 px-3 py-1 bg-dark-700/60 rounded-full text-sm">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-neon-magenta"
                  ></motion.div>
                  <span>Live</span>
                </div>
                
                <AnimatePresence>
                  {totalVotes > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center bg-dark-700/60 px-3 py-1 rounded-full text-sm"
                    >
                      <span className="text-neon-cyan mr-1">{likePercentage}%</span>
                      <span className="text-gray-400">like this track</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;