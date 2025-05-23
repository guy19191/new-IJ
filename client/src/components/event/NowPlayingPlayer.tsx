import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import YouTube, { YouTubeEvent } from 'react-youtube';

interface NowPlayingPlayerProps {
  videoUrl: string;
  title: string;
  artist: string;
  isHost: boolean;
}

const NowPlayingPlayer: React.FC<NowPlayingPlayerProps> = ({
  videoUrl,
  title,
  artist
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  
  useEffect(() => {
    // Extract video ID from URL
    const extractVideoId = (url: string) => {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      return match ? match[1] : null;
    };
    
    setVideoId(extractVideoId(videoUrl));
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  if (!videoId) {
    return (
      <div className="glass-panel p-6 flex items-center justify-center h-[200px]">
        <p className="text-gray-400">Invalid video URL</p>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Hidden YouTube player */}
      <div style={{ display: 'none' }}>
        <YouTube
          videoId={videoId}
          opts={{
            height: '0',
            width: '0',
            playerVars: {
              autoplay: isPlaying ? 1 : 0,
              controls: 0,
              modestbranding: 1,
              mute: isMuted ? 1 : 0
            },
          }}
          onReady={(event: YouTubeEvent) => {
            setPlayer(event.target);
          }}
        />
      </div>
      
      {/* Custom audio player UI */}
      <div className="relative rounded-xl overflow-hidden bg-dark-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause size={24} className="text-white" />
              ) : (
                <Play size={24} className="text-white" />
              )}
            </motion.button>
            
            <div>
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-gray-400">{artist}</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-dark-700/60 text-white hover:bg-dark-700"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingPlayer;