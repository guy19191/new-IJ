import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { supabase } from '../config/database';

const router = Router();

type AsyncRequestHandler = RequestHandler<any, any, any, any>;

// Get user profile
router.get('/', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Get user events
router.get('/events', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .or(`host_id.eq.${userId},guests.cs.{${userId}}`);

    if (error) throw error;
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user events' });
  }
});

// Update user preferences
router.put('/preferences', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { likedGenres, likedEras } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        liked_genres: likedGenres,
        liked_eras: likedEras
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences' });
  }
});

// Upgrade to host
router.post('/upgrade', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data: user, error } = await supabase
      .from('users')
      .update({ can_host: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error upgrading to host' });
  }
});

// Check if user can host
router.get('/can-host', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('can_host')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json({ canHost: user.can_host });
  } catch (error) {
    res.status(500).json({ message: 'Error checking host status' });
  }
});

// Get current user profile
router.get('/me', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/', authenticateJWT as AsyncRequestHandler, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { can_host, ...otherFields } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ can_host, ...otherFields })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

export default router; 