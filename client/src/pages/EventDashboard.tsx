import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Users, Link as LinkIcon } from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import { useSocket } from '../hooks/useSocket';

// Components
import NowPlaying from '../components/event/NowPlaying';
import NowPlayingPlayer from '../components/event/NowPlayingPlayer';
import TrackCard from '../components/event/TrackCard';
import EnergySlider from '../components/event/EnergySlider';
import LyraAvatar from '../components/event/LyraAvatar';
import { PlaylistManager } from '../components/event/PlaylistManager';

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    eventId,
    eventName,
    currentTrack,
    playlist,
    votes,
    energyLevel,
    isHost,
    setEventDetails,
    updateEnergyLevel,
    updatePlaylist
  } = useEventStore();
  
  const { isConnected, updateEnergy } = useSocket(id);
  const [guestLink, setGuestLink] = useState('');
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  
  // Check if this is a valid event
  useEffect(() => {
    if (!eventId && id) {
      // In real app, you would fetch event details from server
      setEventDetails({ 
        eventId: id,
        eventName: 'My Awesome Party',
        isHost: true
      });
    }
    
    // Generate guest link
    const baseUrl = window.location.origin;
    setGuestLink(`${baseUrl}/guest/${id}`);
  }, [id, eventId, setEventDetails]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestLink);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 2000);
  };
  
  const handleEnergyChange = (level: number) => {
    updateEnergyLevel(level);
    updateEnergy(level);
  };
  
  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <button 
            onClick={() => navigate('/create')}
            className="neon-button neon-button-gradient"
          >
            Create a new event
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-gradient">{eventName}</h1>
          <p className="text-gray-400">DJ Dashboard • {isConnected ? 'Connected' : 'Connecting...'}</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyLink}
          className="glass-button flex items-center space-x-2"
        >
          {showLinkCopied ? (
            <span className="text-neon-cyan">Link Copied!</span>
          ) : (
            <>
              <Share2 size={16} />
              <span>Invite Guests</span>
            </>
          )}
        </motion.button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* YouTube Player */}
          {currentTrack?.videoUrl && (
            <NowPlayingPlayer
              videoUrl={currentTrack.videoUrl}
              title={currentTrack.title}
              artist={currentTrack.artist}
              isHost={isHost}
            />
          )}
          
          {/* Now Playing */}
          <NowPlaying 
            track={currentTrack} 
            isHost={isHost}
            votes={votes}
          />
          
          {/* Playlist Manager */}
          <PlaylistManager />
        </div>
        
        <div className="space-y-6">
          {/* Guest link */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Guest Link</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-700/60 text-gray-300 rounded-lg px-3 py-2 border border-white/10 truncate">
                {guestLink}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-dark-700/60 hover:bg-dark-700 text-white"
              >
                <LinkIcon size={18} />
              </motion.button>
            </div>
          </div>
          
          {/* Energy slider */}
          <EnergySlider 
            value={energyLevel} 
            onChange={handleEnergyChange}
            isHost={isHost} 
          />
          
          {/* Voting summary */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Audience Reaction</h3>
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Current track</span>
                <span className="text-white font-medium">{votes.likes + votes.dislikes} votes</span>
              </div>
              
              <div className="w-full h-2 bg-dark-700/60 rounded-full mb-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                  style={{ 
                    width: `${votes.likes + votes.dislikes > 0 ? 
                      Math.round((votes.likes / (votes.likes + votes.dislikes)) * 100) : 0}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-neon-cyan font-medium">{votes.likes}</span>
                  <span className="text-gray-400 ml-1">Likes</span>
                </div>
                <div>
                  <span className="text-neon-magenta font-medium">{votes.dislikes}</span>
                  <span className="text-gray-400 ml-1">Dislikes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lyra AI Avatar */}
      <LyraAvatar 
        energyLevel={energyLevel} 
        isPlaying={true} 
      />
    </div>
  );
};

export default EventDashboard;