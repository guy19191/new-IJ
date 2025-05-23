import React, { useState, useEffect, useRef } from 'react';
import { useEventStore, Track } from '../../store/eventStore';
import { Music, Plus, Play, Pause, SkipForward, Shuffle, RefreshCw, StopCircle, User } from 'lucide-react';
import { useParams } from 'react-router-dom';
import YouTube, { YouTubeEvent } from 'react-youtube';

export const PlaylistManager: React.FC = () => {
  const { id: eventId } = useParams();
  const { 
    eventName, 
    eventDate, 
    mood, 
    genres, 
    user,
    updatePlaylist,
    playlist,
    currentTrack,
    setCurrentTrack,
    setEventDetails
  } = useEventStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoChanging, setIsAutoChanging] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const playerRef = useRef<any>(null);

  // Load event data and check for playlist when component mounts
  useEffect(() => {
    if (eventId) {
      loadEventAndPlaylist();
    }
  }, [eventId]);

  const loadEventAndPlaylist = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      // Load event data
      const eventResponse = await fetch(`/api/events/${eventId}`, {
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
        isHost: eventData.isHost
      });

      // If event has a playlist, load it
      if (eventData.playlist && eventData.playlist.length > 0) {
        // Convert playlist tracks to include YouTube IDs
        const tracksWithVideos = await Promise.all(
          eventData.playlist.map(async (track: Track) => {
            if (!track.videoId) {
              const videoId = await searchYouTubeVideo(track);
              return { ...track, videoId };
            }
            return track;
          })
        );
        updatePlaylist(tracksWithVideos);
      } else {
        // Generate new playlist if none exists
        await handleGeneratePlaylist();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate more songs when playlist is running low
  useEffect(() => {
    if (playlist.length <= 2 && !loading && false) {
      handleGeneratePlaylist();
    }
  }, [playlist.length]);

  // Handle track ending
  const handleTrackEnd = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    } else if (playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
  };

  // Search for YouTube video ID
  const searchYouTubeVideo = async (track: Track): Promise<string> => {
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(`${track.title} ${track.artist} official`)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('YouTube search failed:', errorData);
        // Return a fallback video ID for a generic music video
        return 'dQw4w9WgXcQ'; // Fallback to a default video ID
      }
      
      const data = await response.json();
      return data.videoId;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      // Return a fallback video ID for a generic music video
      return 'dQw4w9WgXcQ'; // Fallback to a default video ID
    }
  };

  const handleGeneratePlaylist = async () => {
    if (!eventId) {
      setError('Event ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          eventDetails: {
            type: eventName,
            date: eventDate,
            location: 'Event Location',
            description: `A ${mood} event with ${genres.join(', ')} music`
          },
          userPreferences: {
            favoriteGenres: user?.favoriteGenres || [],
            favoriteArtists: [],
            mood: mood
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate playlist');
      }

      const data = await response.json();
      
      // Convert the generated songs to your Track format and search for YouTube IDs
      const tracks: Track[] = await Promise.all(data.songs.map(async (song: any, index: number) => {
        const track: Track = {
          id: `generated-${index}`,
          title: song.title,
          artist: song.artist,
          albumArt: `https://picsum.photos/200/200?random=${index}`,
          duration: 180,
          likes: 0,
          dislikes: 0
        };
        const videoId = await searchYouTubeVideo(track);
        return { ...track, videoId };
      }));

      updatePlaylist([...playlist, ...tracks]);
      
      // Start playing if this is the first batch of songs
      if (playlist.length === 0 && tracks.length > 0) {
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate playlist. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleNext = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    } else if (playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
  };

  const handleMixPlaylist = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/${eventId}/mix`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mix playlist');
      }

      const { event } = await response.json();
      updatePlaylist(event.playlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mix playlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoChange = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/${eventId}/auto-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interval: 180000 }) // 3 minutes
      });

      if (!response.ok) {
        throw new Error('Failed to start auto-change');
      }

      setIsAutoChanging(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start auto-change');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutoChange = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/${eventId}/stop-auto-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to stop auto-change');
      }

      setIsAutoChanging(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop auto-change');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePlaylist = async () => {
    if (!eventId) {
      setError('Event ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          eventDetails: {
            type: eventName,
            date: eventDate,
            location: 'Event Location',
            description: `A ${mood} event with ${genres.join(', ')} music`
          },
          userPreferences: {
            favoriteGenres: user?.favoriteGenres || [],
            favoriteArtists: [],
            mood: mood
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate playlist');
      }

      const data = await response.json();
      
      // Convert the generated songs to your Track format and search for YouTube IDs
      const tracks: Track[] = await Promise.all(data.songs.map(async (song: any, index: number) => {
        const track: Track = {
          id: `generated-${index}`,
          title: song.title,
          artist: song.artist,
          albumArt: `https://picsum.photos/200/200?random=${index}`,
          duration: 180,
          likes: 0,
          dislikes: 0
        };
        const videoId = await searchYouTubeVideo(track);
        return { ...track, videoId };
      }));

      // Keep the first two songs and add the new tracks
      const firstTwoSongs = playlist.slice(0, 2);
      updatePlaylist([...firstTwoSongs, ...tracks]);
      
      // If we're currently playing one of the first two songs, keep playing
      // Otherwise, start playing from the first new song
      if (currentTrack && !firstTwoSongs.find(song => song.id === currentTrack.id)) {
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate playlist. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalizePlaylist = async () => {
    if (!eventId) {
      setError('Event ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlist/${eventId}/personalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate personalized playlist');
      }

      const data = await response.json();
      
      // Convert the generated songs to your Track format and search for YouTube IDs
      const tracks: Track[] = await Promise.all(data.playlist.map(async (song: any, index: number) => {
        const track: Track = {
          id: `generated-${index}`,
          title: song.title,
          artist: song.artist,
          albumArt: `https://picsum.photos/200/200?random=${index}`,
          duration: 180,
          likes: 0,
          dislikes: 0
        };
        const videoId = await searchYouTubeVideo(track);
        return { ...track, videoId };
      }));

      // Keep the first two songs and add the new tracks
      const firstTwoSongs = playlist.slice(0, 2);
      updatePlaylist([...firstTwoSongs, ...tracks]);
      
      // If we're currently playing one of the first two songs, keep playing
      // Otherwise, start playing from the first new song
      if (currentTrack && !firstTwoSongs.find(song => song.id === currentTrack.id)) {
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate personalized playlist. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            <SkipForward size={24} />
          </button>
          <button
            onClick={handleMixPlaylist}
            className="p-2 rounded-full hover:bg-gray-700"
            disabled={loading}
          >
            <Shuffle size={24} />
          </button>
          {!isAutoChanging ? (
            <button
              onClick={handleAutoChange}
              className="p-2 rounded-full hover:bg-gray-700"
              disabled={loading}
            >
              <RefreshCw size={24} />
            </button>
          ) : (
            <button
              onClick={handleStopAutoChange}
              className="p-2 rounded-full hover:bg-gray-700"
              disabled={loading}
            >
              <StopCircle size={24} />
            </button>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Playlist</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePersonalizePlaylist}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-neon-green text-white rounded-full hover:bg-neon-purple transition-colors disabled:opacity-50"
            >
              <User size={18} className="mr-2" />
              {loading ? 'Personalizing...' : 'Personalize Playlist'}
            </button>
            <button
              onClick={handleRegeneratePlaylist}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-neon-blue text-white rounded-full hover:bg-neon-purple transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className="mr-2" />
              {loading ? 'Regenerating...' : 'Regenerate Playlist'}
            </button>
            <button
              onClick={handleGeneratePlaylist}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-neon-magenta text-white rounded-full hover:bg-neon-purple transition-colors disabled:opacity-50"
            >
              <Plus size={18} className="mr-2" />
              {loading ? 'Generating...' : 'Generate Playlist'}
            </button>
          </div>
        </div>

        {currentTrack && (
          <div className="mb-4">
            <div className="relative aspect-video mb-2">
              <YouTube
                videoId={currentTrack.videoId}
                opts={{
                  height: '0%',
                  width: '0%',
                  playerVars: {
                    autoplay: isPlaying ? 1 : 0,
                    controls: 0,
                  },
                }}
                onReady={(event: YouTubeEvent) => {
                  setPlayer(event.target);
                  playerRef.current = event.target;
                }}
                onEnd={handleTrackEnd}
                className="absolute inset-0"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {playlist.map((track) => (
            <div
              key={track.id}
              className={`flex items-center p-3 rounded-lg hover:bg-dark-700/60 transition-colors cursor-pointer ${
                track.id === currentTrack?.id ? 'bg-neon-magenta/20' : 'bg-dark-700/40'
              }`}
              onClick={() => {
                setCurrentTrack(track);
                setIsPlaying(true);
              }}
            >
              <img
                src={track.albumArt}
                alt={`${track.title} album art`}
                className="w-12 h-12 rounded-lg mr-4"
              />
              <div className="flex-1">
                <h3 className="font-medium text-white">{track.title}</h3>
                <p className="text-sm text-gray-400">{track.artist}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}

          {playlist.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Music className="mx-auto h-8 w-8 mb-2" />
              <p>No tracks in playlist</p>
              <p className="text-sm mt-1">Click "Generate Playlist" to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 