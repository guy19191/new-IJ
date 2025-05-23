import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  videoId?: string;
  likes?: number;
  dislikes?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  provider: 'spotify' | 'youtube' | 'apple';
  favoriteGenres: string[];
  favoriteEras: string[];
  can_host?: boolean;
  email?: string;
}

export interface AttendedEvent {
  id: string;
  name: string;
  date: string;
  likedSongs: Track[];
}

export interface EventState {
  // User profile
  user: UserProfile | null;
  attendedEvents: AttendedEvent[];
  
  // Event details
  eventId: string | null;
  eventName: string;
  eventDate: string;
  mood: string;
  genres: string[];
  eras: string[];
  isHost: boolean;
  
  // Playback state
  currentTrack: Track | null;
  playlist: Track[];
  energyLevel: number;
  
  // Voting state
  votes: {
    likes: number;
    dislikes: number;
  };
  
  // Control functions
  setUser: (user: UserProfile) => void;
  setAttendedEvents: (events: AttendedEvent[]) => void;
  setEventDetails: (details: Partial<EventState>) => void;
  updateCurrentTrack: (track: Track) => void;
  updatePlaylist: (playlist: Track[]) => void;
  updateVotes: (votes: { likes: number; dislikes: number }) => void;
  updateEnergyLevel: (level: number) => void;
  createEvent: (eventDetails: Partial<EventState>) => string;
  setCurrentTrack: (track: Track | null) => void;
}

export const useEventStore = create<EventState>((set) => ({
  // Initial user state
  user: null,
  attendedEvents: [],
  
  // Initial event details
  eventId: null,
  eventName: '',
  eventDate: '',
  mood: 'energetic',
  genres: [],
  eras: [],
  isHost: false,
  
  // Initial playback state
  currentTrack: null,
  playlist: [],
  energyLevel: 75,
  
  // Initial voting state
  votes: {
    likes: 0,
    dislikes: 0,
  },
  
  // Action functions
  setUser: (user) => set({ user }),
  
  setAttendedEvents: (events) => set({ attendedEvents: events }),
  
  setEventDetails: (details) => set((state) => ({ ...state, ...details })),
  
  updateCurrentTrack: (track) => set({ currentTrack: track }),
  
  updatePlaylist: (playlist) => set({ playlist }),
  
  updateVotes: (votes) => set({ votes }),
  
  updateEnergyLevel: (level) => set({ energyLevel: level }),
  
  // Create a new event
  createEvent: (eventDetails) => {
    const eventId = `event-${Date.now()}`;
    set((state) => ({ 
      ...state, 
      ...eventDetails, 
      eventId, 
      isHost: true 
    }));
    return eventId;
  },
  
  setCurrentTrack: (track) => set({ currentTrack: track }),
}));