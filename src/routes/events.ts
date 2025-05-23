import { Router, Request, Response, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { supabase } from '../config/database';
import { socketService } from '../app';
import { findYouTubeVideo } from '../utils/youtube';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

type AsyncRequestHandler = RequestHandler<any, any, any, any>;

// Create event
router.post('/', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { name, mood, provider, genres, eras } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('can_host')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error checking user:', userError);
      return res.status(500).json({ error: 'Error checking user permissions' });
    }

    if (!user?.can_host) {
      return res.status(403).json({ error: 'User is not authorized to host events' });
    }

    const eventId = uuidv4().toString();
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        id: eventId,
        name,
        mood,
        provider: provider || "Youtube",
        genres: genres || ["Pop"],
        eras: eras || ["2020s"],
        date: new Date(),
        host_id: userId,
        guests: [],
        playlist: [],
        energy: 0.5
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating event:', insertError);
      return res.status(500).json({ error: 'Error creating event' });
    }

    if (!event) {
      return res.status(500).json({ error: 'Failed to create event' });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error in event creation:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
}) as AsyncRequestHandler);

// Join event
router.post('/:id/join', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already a guest
    const isAlreadyGuest = event.guests.includes(userId);
    if (!isAlreadyGuest) {
      // Add user to guests array
      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update({
          guests: [...event.guests, userId]
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating event guests:', updateError);
        return res.status(500).json({ error: 'Failed to join event' });
      }

      // Emit socket event for guest joined
      socketService.emitToEvent(id, 'guest_joined', { 
        userId,
        guestCount: updatedEvent.guests.length
      });

      res.json(updatedEvent);
    } else {
      // User is already a guest, just return the event data
      res.json(event);
    }
  } catch (error) {
    console.error('Error in join event:', error);
    res.status(500).json({ error: 'Error joining event' });
  }
}) as AsyncRequestHandler);

// Generate playlist
router.post('/:id/generate', (authenticateJWT as AsyncRequestHandler), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (!event || event.host_id !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    // TODO: Implement Lyra AI logic for playlist generation
    // For now, we'll just return a mock playlist
    const mockPlaylist = [
      { title: 'Mock Song 1', artist: 'Mock Artist 1' },
      { title: 'Mock Song 2', artist: 'Mock Artist 2' }
    ];

    const playlist = await Promise.all(
      mockPlaylist.map(async (track) => {
        const video = await findYouTubeVideo(`${track.artist} - ${track.title}`);
        return {
          id: uuidv4().toString(),
          ...video,
          votes: { likes: 0, dislikes: 0 }
        };
      })
    );

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({ playlist })
      .eq('id', id)
      .select()
      .single();

    socketService.emitToEvent(id, 'playlist_updated', { playlist });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error generating playlist' });
  }
}) as AsyncRequestHandler);

// Get event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' });
      }
      throw error;
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Vote on track
router.post('/:id/vote', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trackId, voteType } = req.body;
    const userId = req.user?.id;

    const { data: event } = await supabase
      .from('events')
      .select('playlist')
      .eq('id', id)
      .single();

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const updatedPlaylist = event.playlist.map((track: any) => {
      if (track.id === trackId) {
        return {
          ...track,
          votes: {
            ...track.votes,
            [voteType]: track.votes[voteType] + 1
          }
        };
      }
      return track;
    });

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({ playlist: updatedPlaylist })
      .eq('id', id)
      .select()
      .single();

    socketService.emitToEvent(id, 'vote_update', {
      trackId,
      userId,
      voteType
    });

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on track' });
  }
}) as AsyncRequestHandler);

// Suggest track
router.post('/:id/suggest', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query } = req.body;
    const userId = req.user?.id;

    const video = await findYouTubeVideo(query);
    const suggestion = {
      id: uuidv4().toString(),
      trackId: uuidv4().toString(),
      userId,
      query,
      status: 'pending',
      ...video,
      votes: { likes: 0, dislikes: 0 }
    };

    const { data: event } = await supabase
      .from('events')
      .select('suggestions')
      .eq('id', id)
      .single();

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const updatedSuggestions = [...(event.suggestions || []), suggestion];

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({ suggestions: updatedSuggestions })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    socketService.emitToEvent(id, 'suggestions_updated', { suggestion });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error suggesting track' });
  }
}) as AsyncRequestHandler);

// Host controls
router.post('/:id/controls/skip', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: event } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!event || event.host_id !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    socketService.emitToEvent(id, 'track_skipped', {});
    res.json({ message: 'Track skipped' });
  } catch (error) {
    res.status(500).json({ message: 'Error skipping track' });
  }
}) as AsyncRequestHandler);

router.post('/:id/controls/remove', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trackId } = req.body;
    const userId = req.user?.id;

    const { data: event } = await supabase
      .from('events')
      .select('host_id, playlist')
      .eq('id', id)
      .single();

    if (!event || event.host_id !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const updatedPlaylist = event.playlist.filter((track: any) => track.id !== trackId);

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({ playlist: updatedPlaylist })
      .eq('id', id)
      .select()
      .single();

    socketService.emitToEvent(id, 'track_removed', { trackId });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error removing track' });
  }
}) as AsyncRequestHandler);

router.post('/:id/controls/set-energy', authenticateJWT as AsyncRequestHandler, (async (req: Request, res: Response) => {
  try { 
    const { id } = req.params;
    const { energy } = req.body;
    const userId = req.user?.id;

    const { data: event } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!event || event.host_id !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({ energy })
      .eq('id', id)
      .select()
      .single();

    socketService.emitToEvent(id, 'energy_changed', { energy });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error setting energy level' });
  }
}) as AsyncRequestHandler);

export default router; 