import { Request, Response } from 'express';
import { supabase } from '../config/database';


export const saveFavoriteSong = async (req: Request, res: Response) => {
  try {
    const { trackId, trackName, artist, genre } = req.body;
    const userId = req.user?.id;

    if (!userId || !trackId || !trackName || !artist) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('user_favorite_songs')
      .upsert({
        user_id: userId,
        track_id: trackId,
        track_name: trackName,
        artist,
        genre
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving favorite song:', error);
      return res.status(500).json({ error: 'Failed to save favorite song' });
    }

    res.json({ song: data });
  } catch (error) {
    console.error('Error in saveFavoriteSong:', error);
    res.status(500).json({ error: 'Failed to save favorite song' });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('user_favorite_songs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorite songs:', error);
      return res.status(500).json({ error: 'Failed to fetch favorite songs' });
    }

    res.json({ songs: data });
  } catch (error) {
    console.error('Error in getUserFavorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorite songs' });
  }
};

export const getChatGPTInteractions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('chatgpt_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ChatGPT interactions:', error);
      return res.status(500).json({ error: 'Failed to fetch interactions' });
    }

    res.json({ interactions: data });
  } catch (error) {
    console.error('Error in getChatGPTInteractions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
}; 