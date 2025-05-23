import React from 'react';
import { Heart, Music } from 'lucide-react';

interface SongCardProps {
  trackId: string;
  title: string;
  artist: string;
  genre?: string;
}

export const SongCard: React.FC<SongCardProps> = ({
  trackId,
  title,
  artist,
  genre
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Music className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500 truncate">{artist}</p>
          {genre && (
            <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {genre}
            </span>
          )}
        </div>
        <button
          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Like song"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 