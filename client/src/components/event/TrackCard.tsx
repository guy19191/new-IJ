import { motion } from 'framer-motion';
import { Heart, ThumbsDown, Clock } from 'lucide-react';
import { Track } from '../../store/eventStore';

interface TrackCardProps {
  track: Track;
  isCurrentTrack?: boolean;
  showVoting?: boolean;
  onVote?: (vote: 'like' | 'dislike') => void;
  index?: number;
}

const formatTime = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const TrackCard: React.FC<TrackCardProps> = ({ 
  track, 
  isCurrentTrack = false, 
  showVoting = false,
  onVote,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index ? index * 0.1 : 0 }}
      className={`track-card ${isCurrentTrack ? 'border-neon-magenta/50 shadow-[0_0_10px_rgba(255,0,255,0.2)]' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative h-12 w-12 md:h-16 md:w-16 flex-shrink-0">
          <img 
            src={track.albumArt} 
            alt={`${track.title} album art`}
            className="h-full w-full object-cover rounded-md"
          />
          {isCurrentTrack && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 bg-neon-magenta rounded-md opacity-40"
            ></motion.div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{track.title}</h3>
          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!showVoting && (
            <div className="flex items-center text-gray-400 text-sm">
              <Clock size={14} className="mr-1" />
              <span>{formatTime(track.duration)}</span>
            </div>
          )}
          
          {showVoting && (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onVote && onVote('like')}
                className="p-2 rounded-full bg-dark-700/60 hover:bg-dark-700/90 text-neon-cyan"
              >
                <Heart size={18} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onVote && onVote('dislike')}
                className="p-2 rounded-full bg-dark-700/60 hover:bg-dark-700/90 text-neon-magenta"
              >
                <ThumbsDown size={18} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      {showVoting && track.likes !== undefined && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center">
          <div className="w-full bg-dark-700/60 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-neon-cyan to-neon-purple h-1.5 rounded-full"
              style={{ 
                width: `${track.likes && track.dislikes ? 
                  Math.round((track.likes / (track.likes + track.dislikes)) * 100) : 
                  0}%` 
              }}
            ></div>
          </div>
          <div className="ml-2 flex items-center space-x-2 text-xs">
            <span className="text-neon-cyan">{track.likes}</span>
            <span className="text-white/50">|</span>
            <span className="text-neon-magenta">{track.dislikes}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TrackCard;