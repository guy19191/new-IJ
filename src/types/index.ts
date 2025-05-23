export type Provider = 'spotify' | 'youtube' | 'apple';

export interface User {
  id: string;
  displayName: string;
  avatar: string;
  provider: Provider;
  likedGenres: string[];
  likedEras: string[];
  attendedEvents: string[];
  canHost: boolean;
}

export interface Event {
  id: string;
  name: string;
  mood: string;
  date: Date;
  provider: Provider;
  genres: string[];
  eras: string[];
  hostId: string;
  guests: string[];
  playlist: Track[];
  nowPlaying?: Track;
  energy: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  videoUrl: string;
  videoId: string;
  thumbnail: string;
  votes: {
    likes: number;
    dislikes: number;
  };
  suggestedBy?: string;
}

export interface Vote {
  trackId: string;
  userId: string;
  type: 'like' | 'dislike';
}

export interface Suggestion {
  id: string;
  trackId: string;
  userId: string;
  query: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SocketUser {
  userId: string;
  eventId: string;
  socketId: string;
} 