import React from 'react';
import { Music, Play } from 'lucide-react';

interface PlaylistCardProps {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  id,
  name,
  description,
  trackCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Music className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          {description && (
            <p className="text-sm text-gray-500 truncate">{description}</p>
          )}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{trackCount} tracks</span>
          </div>
        </div>
        <button
          className="flex-shrink-0 p-2 text-gray-400 hover:text-purple-500 transition-colors"
          aria-label="Play playlist"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 