import React, { useState } from 'react';
import { PlaylistService } from '../services/playlistService';

interface Song {
  title: string;
  artist: string;
  genre: string;
  year?: number;
}

export const PlaylistGenerator: React.FC = () => {
  const [eventDetails, setEventDetails] = useState({
    type: '',
    date: '',
    location: '',
    description: ''
  });

  const [userPreferences, setUserPreferences] = useState({
    favoriteGenres: [] as string[],
    favoriteArtists: [] as string[],
    mood: ''
  });

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlaylist = async () => {
    setLoading(true);
    setError(null);

    try {
      const playlistService = new PlaylistService(process.env.VITE_OPENAI_API_KEY || '');
      const songs = await playlistService.generatePlaylist({
        eventDetails,
        userPreferences
      });
      setPlaylist(songs);
    } catch (err) {
      setError('Failed to generate playlist. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Playlist Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Event Details</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={eventDetails.type}
              onChange={(e) => setEventDetails({ ...eventDetails, type: e.target.value })}
              placeholder="e.g., Wedding, Birthday Party"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={eventDetails.date}
              onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={eventDetails.location}
              onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
              placeholder="e.g., Beach, Garden, Indoor Venue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded"
              value={eventDetails.description}
              onChange={(e) => setEventDetails({ ...eventDetails, description: e.target.value })}
              placeholder="Describe the event atmosphere and theme"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Preferences</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Favorite Genres</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userPreferences.favoriteGenres.join(', ')}
              onChange={(e) => setUserPreferences({
                ...userPreferences,
                favoriteGenres: e.target.value.split(',').map(genre => genre.trim())
              })}
              placeholder="e.g., Rock, Pop, Jazz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Favorite Artists</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userPreferences.favoriteArtists.join(', ')}
              onChange={(e) => setUserPreferences({
                ...userPreferences,
                favoriteArtists: e.target.value.split(',').map(artist => artist.trim())
              })}
              placeholder="e.g., The Beatles, Taylor Swift"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mood</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userPreferences.mood}
              onChange={(e) => setUserPreferences({ ...userPreferences, mood: e.target.value })}
              placeholder="e.g., Upbeat, Relaxed, Energetic"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGeneratePlaylist}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Generating...' : 'Generate Playlist'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {playlist.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Your Generated Playlist</h2>
          <div className="space-y-2">
            {playlist.map((song, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium">{song.title}</h3>
                <p className="text-gray-600">{song.artist}</p>
                <p className="text-sm text-gray-500">{song.genre} {song.year ? `• ${song.year}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 