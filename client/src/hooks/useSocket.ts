import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEventStore } from '../store/eventStore';

// Socket.IO server URL - using relative path for proxy
const SOCKET_URL = '/socket.io';

export const useSocket = (eventId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { updateCurrentTrack, updatePlaylist, updateVotes } = useEventStore();

  // Connect to socket
  useEffect(() => {
    if (!eventId) return;

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      query: { eventId },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join event room after connection
      if (eventId) {
        socketRef.current?.emit('join_event', eventId);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('track_change', (track) => {
      updateCurrentTrack(track);
    });

    socketRef.current.on('playlist_update', (playlist) => {
      updatePlaylist(playlist);
    });

    socketRef.current.on('vote_update', (votes) => {
      updateVotes(votes);
    });

    // Clean up
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId, updateCurrentTrack, updatePlaylist, updateVotes]);

  // Send vote
  const sendVote = useCallback((vote: 'like' | 'dislike') => {
    if (socketRef.current) {
      socketRef.current.emit('vote_track', { vote });
    }
  }, []);

  // Send song suggestion
  const sendSuggestion = useCallback((suggestion: string) => {
    if (socketRef.current) {
      socketRef.current.emit('suggest_track', { suggestion });
      return true;
    }
    return false;
  }, []);

  // Update energy level
  const updateEnergy = useCallback((level: number) => {
    if (socketRef.current) {
      socketRef.current.emit('set_energy', { level });
    }
  }, []);

  return {
    isConnected,
    sendVote,
    sendSuggestion,
    updateEnergy,
  };
};