import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SongCard } from '../components/SongCard';
import { PlaylistCard } from '../components/PlaylistCard';
import { getProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  display_name: string;
  avatar: string;
  email: string;
  favoriteSongs: Array<{
    track_id: string;
    track_name: string;
    artist: string;
    genre: string;
    created_at: string;
  }>;
  genres: string[];
  playlists: Array<{
    id: string;
    name: string;
    description: string;
    trackCount: number;
  }>;
  preferences: {
    liked_genres: string[];
    liked_eras: string[];
    preferred_tempo: number | null;
    preferred_instruments: string[];
    mood_preferences: Record<string, any>;
  };
  recentChatGPTInteractions: Array<{
    prompt: string;
    response: string;
    created_at: string;
  }>;
}

const Profile: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && false) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No profile found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={profile.avatar || '/default-avatar.png'}
            alt={profile.display_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.display_name}</h1>
            <p className="text-gray-600">{profile.email}</p>
            <div className="mt-2">
              <h2 className="text-xl font-semibold mb-2">Favorite Genres</h2>
              <div className="flex flex-wrap gap-2">
                {profile.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Preferences */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Music Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Preferred Genres</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferences.liked_genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preferred Eras</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferences.liked_eras.map((era) => (
                <span
                  key={era}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  {era}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Songs Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Favorite Songs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.favoriteSongs.map((song) => (
            <SongCard
              key={song.track_id}
              trackId={song.track_id}
              title={song.track_name}
              artist={song.artist}
              genre={song.genre}
            />
          ))}
        </div>
      </div>

      {/* Playlists Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              id={playlist.id}
              name={playlist.name}
              description={playlist.description}
              trackCount={playlist.trackCount}
            />
          ))}
        </div>
      </div>

      {/* Recent ChatGPT Interactions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent AI Recommendations</h2>
        <div className="space-y-4">
          {profile.recentChatGPTInteractions.map((interaction) => (
            <div
              key={interaction.created_at}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="text-sm text-gray-500 mb-2">
                {new Date(interaction.created_at).toLocaleDateString()}
              </div>
              <div className="mb-2">
                <h3 className="font-semibold">Prompt:</h3>
                <p className="text-gray-700">{interaction.prompt}</p>
              </div>
              <div>
                <h3 className="font-semibold">Response:</h3>
                <p className="text-gray-700">{interaction.response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;