import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Music, Users } from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';


// Components
import NowPlaying from '../components/event/NowPlaying';
import TrackCard from '../components/event/TrackCard';
import SuggestionForm from '../components/event/SuggestionForm';






const GuestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    eventId, 
    eventName, 
    currentTrack, 
    playlist,
    votes,
    setEventDetails,
    updatePlaylist,
    setCurrentTrack
  } = useEventStore();
  
  const { isConnected, sendVote, sendSuggestion } = useSocket(id);
  const [hasVoted, setHasVoted] = useState(false);
  const [guests, setGuests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);


  // Load event data when component mounts
  useEffect(() => {
    if (!isAuthenticated && false) {
      navigate('/login', { state: { from: window.location.pathname} });
      return;
    }
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Load event data
      const eventResponse = await fetch(`/api/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!eventResponse.ok) {
        throw new Error('Failed to load event data');
      }

      const eventData = await eventResponse.json();
      
      // Update event details in store
      setEventDetails({
        eventId: eventData.id,
        eventName: eventData.name,
        eventDate: eventData.date,
        mood: eventData.mood,
        genres: eventData.genres,
        eras: eventData.eras,
        isHost: false
      });

      // Update guest count
      setGuests(eventData.guests?.length || 0);

      // Check if user is already a guest
      const userId = localStorage.getItem('user_id');
      setHasJoined(eventData.guests?.includes(userId) || false);

      // If already joined, load playlist
      if (hasJoined && eventData.playlist && eventData.playlist.length > 0) {
        updatePlaylist(eventData.playlist);
        if (eventData.playlist[0]) {
          setCurrentTrack(eventData.playlist[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    setLoading(true);
    try {
      // First join the event
      const joinResponse = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!joinResponse.ok) {
        throw new Error('Failed to join event');
      }

      // Then generate personalized playlist
      const playlistResponse = await fetch(`/api/playlist/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!playlistResponse.ok) {
        throw new Error('Failed to generate playlist');
      }

      setHasJoined(true);
      navigate(`/event/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVote = (vote: 'like' | 'dislike') => {
    sendVote(vote);
    setHasVoted(true);
    
    // Reset vote after some time to allow revoting
    setTimeout(() => {
      setHasVoted(false);
    }, 10000);
  };
  
  const handleSuggestion = (suggestion: string) => {
    return sendSuggestion(suggestion);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Link 
            to="/"
            className="neon-button neon-button-gradient"
          >
            Find another event
          </Link>
        </div>
      </div>
    );
  }
  
  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Link 
            to="/"
            className="neon-button neon-button-gradient"
          >
            Find another event
          </Link>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 neon-gradient">{eventName}</h2>
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
              <Users size={20} />
              <span>{guests} guests</span>
            </div>
            <p className="text-gray-400">Join this event to listen to music and vote on tracks!</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinEvent}
            disabled={loading}
            className="neon-button neon-button-gradient w-full"
          >
            {loading ? 'Joining...' : 'Join Event'}
          </motion.button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold neon-gradient">{eventName}</h1>
          <p className="text-gray-400">
            {isConnected ? (
              <span>Live Event • {guests} guests</span>
            ) : (
              'Connecting...'
            )}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/create')}
          className="glass-button flex items-center space-x-2"
        >
          <Crown size={16} />
          <span>Become a Host</span>
        </motion.button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Now Playing */}
          <NowPlaying 
            track={currentTrack} 
            isHost={false}
            votes={votes}
          />
          
          {/* Current Track with Voting */}
          <div className="glass-panel p-4">
            <h2 className="text-lg font-semibold mb-4">Currently Playing</h2>
            
            {currentTrack ? (
              <TrackCard 
                track={currentTrack}
                isCurrentTrack={true}
                showVoting={true}
                onVote={hasVoted ? undefined : handleVote}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Music className="mx-auto h-8 w-8 mb-2" />
                <p>No track is currently playing</p>
              </div>
            )}
            
            {hasVoted && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Thanks for voting! You can vote again in a few seconds.
              </div>
            )}
          </div>

          {/* Playlist */}
          <div className="glass-panel p-4">
            <h2 className="text-lg font-semibold mb-4">Playlist</h2>
            <div className="space-y-2">
              {playlist.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isCurrentTrack={track.id === currentTrack?.id}
                  showVoting={false}
                />
              ))}
              {playlist.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Music className="mx-auto h-8 w-8 mb-2" />
                  <p>No tracks in playlist</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Song suggestion form */}
          <SuggestionForm onSubmit={handleSuggestion} />
          
          {/* Event info */}
          <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Event Info</h3>
            <div className="space-y-3">
              <div className="bg-dark-700/40 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Host</div>
                <div className="font-medium">DJ MixMaster</div>
              </div>
              
              <div className="bg-dark-700/40 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Mood</div>
                <div className="font-medium">Party 🎉</div>
              </div>
              
              <div className="bg-dark-700/40 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Guests</div>
                  <div className="font-medium">{guests} listening</div>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="flex -space-x-2"
                >
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-magenta/80 to-neon-cyan/80 flex items-center justify-center text-xs font-bold"
                    >
                      {i}
                    </div>
                  ))}
                  {guests > 3 && (
                    <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs">
                      +{guests - 3}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="glass-panel p-4 border border-neon-magenta/30">
            <h3 className="text-lg font-semibold mb-2">Create Your Own Event</h3>
            <p className="text-gray-300 text-sm mb-4">
              Want to be the DJ? Start your own IJ event and control the music.
            </p>
            <Link 
              to="/create"
              className="neon-button neon-button-gradient w-full text-center"
            >
              Become a Host
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestView;