import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's basic info with a single query including all related data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        favoriteSongs:user_favorite_songs(
          track_id,
          track_name,
          artist,
          genre,
          created_at
        ),
        playlists:user_playlists(
          id,
          name,
          description,
          tracks:playlist_tracks(count)
        ),
        preferences:user_preferences(
          liked_genres,
          liked_eras,
          preferred_tempo,
          preferred_instruments,
          mood_preferences
        ),
        recentChatGPTInteractions:chatgpt_interactions(
          prompt,
          response,
          created_at
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Extract unique genres from favorite songs
    const genres = [...new Set(user.favoriteSongs.map(song => song.genre).filter(Boolean))];

    // Format the response
    const profile = {
      id: user.id,
      display_name: user.display_name,
      avatar: user.avatar,
      email: user.email,
      favoriteSongs: user.favoriteSongs,
      genres,
      playlists: user.playlists.map(playlist => ({
        ...playlist,
        trackCount: playlist.tracks[0].count
      })),
      preferences: user.preferences[0] || {
        liked_genres: [],
        liked_eras: [],
        preferred_tempo: null,
        preferred_instruments: [],
        mood_preferences: {}
      },
      recentChatGPTInteractions: user.recentChatGPTInteractions
    };

    res.json({ profile });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      displayName, 
      avatar, 
      preferences 
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update user's basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        avatar,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user profile:', userError);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    // Update user preferences
    if (preferences) {
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (preferencesError) {
        console.error('Error updating user preferences:', preferencesError);
        return res.status(500).json({ error: 'Failed to update user preferences' });
      }
    }

    // Fetch updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('users')
      .select(`
        *,
        preferences:user_preferences(*)
      `)
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch updated profile' });
    }

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
}; 