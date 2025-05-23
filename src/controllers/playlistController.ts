import { Request, Response } from 'express';
import { PlaylistService } from '../services/playlistService';
import { supabase } from '../config/database';
import { OpenAIService } from '../services/openaiService';

const playlistService = new PlaylistService();
const openaiService = new OpenAIService();

// Helper function to shuffle array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const generatePlaylist = async (req: Request, res: Response) => {
  try {
    const { eventId, eventDetails, userPreferences } = req.body;

    if (!eventId || !eventDetails || !userPreferences) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Generate playlist
    const songs = await playlistService.generatePlaylist({
      eventDetails,
      userPreferences
    });

    // Update event with new playlist
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ playlist: songs })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event playlist:', updateError);
      return res.status(500).json({ error: 'Failed to save playlist' });
    }

    res.json({ songs, event: updatedEvent });
  } catch (error) {
    console.error('Error in generatePlaylist controller:', error);
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
};

export const mixPlaylist = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get current playlist
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('playlist')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Shuffle the playlist
    const shuffledPlaylist = shuffleArray([...event.playlist]);

    // Update event with shuffled playlist
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ playlist: shuffledPlaylist })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event playlist:', updateError);
      return res.status(500).json({ error: 'Failed to mix playlist' });
    }

    res.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error in mixPlaylist controller:', error);
    res.status(500).json({ error: 'Failed to mix playlist' });
  }
};

export const autoChangeSongs = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { interval = 300000 } = req.body; // Default 5 minutes in milliseconds

    // Get current playlist
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('playlist')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Start auto-changing songs
    const autoChangeInterval = setInterval(async () => {
      const shuffledPlaylist = shuffleArray([...event.playlist]);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ playlist: shuffledPlaylist })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating playlist in auto-change:', updateError);
        clearInterval(autoChangeInterval);
      }
    }, interval);

    // Store the interval ID in the event for cleanup
    const { error: updateError } = await supabase
      .from('events')
      .update({ auto_change_interval: autoChangeInterval })
      .eq('id', eventId);

    if (updateError) {
      clearInterval(autoChangeInterval);
      return res.status(500).json({ error: 'Failed to start auto-change' });
    }

    res.json({ message: 'Auto-change started successfully', interval });
  } catch (error) {
    console.error('Error in autoChangeSongs controller:', error);
    res.status(500).json({ error: 'Failed to start auto-change' });
  }
};

export const stopAutoChange = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get current event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('auto_change_interval')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Clear the interval if it exists
    if (event.auto_change_interval) {
      clearInterval(event.auto_change_interval);
    }

    // Remove the interval ID from the event
    const { error: updateError } = await supabase
      .from('events')
      .update({ auto_change_interval: null })
      .eq('id', eventId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to stop auto-change' });
    }

    res.json({ message: 'Auto-change stopped successfully' });
  } catch (error) {
    console.error('Error in stopAutoChange controller:', error);
    res.status(500).json({ error: 'Failed to stop auto-change' });
  }
};

export const generatePersonalizedPlaylist = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's preferences and favorite songs
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select(`
        preferences:user_preferences(
          liked_genres,
          liked_eras,
          preferred_tempo,
          preferred_instruments,
          mood_preferences
        ),
        favoriteSongs:user_favorite_songs(
          track_name,
          artist,
          genre
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user preferences:', userError);
      return res.status(500).json({ error: 'Failed to fetch user preferences' });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Build a detailed prompt for ChatGPT
    const prompt = `Create a personalized playlist based on the following user preferences and event details:

User Preferences:
- Favorite Genres: ${userProfile.preferences[0]?.liked_genres.join(', ') || 'Not specified'}
- Favorite Eras: ${userProfile.preferences[0]?.liked_eras.join(', ') || 'Not specified'}
- Preferred Tempo: ${userProfile.preferences[0]?.preferred_tempo || 'Not specified'}
- Preferred Instruments: ${userProfile.preferences[0]?.preferred_instruments.join(', ') || 'Not specified'}
- Mood Preferences: ${JSON.stringify(userProfile.preferences[0]?.mood_preferences || {})}

User's Favorite Songs:
${userProfile.favoriteSongs.map(song => `- ${song.track_name} by ${song.artist} (${song.genre})`).join('\n')}

Event Details:
- Type: ${event.type}
- Mood: ${event.mood}
- Genres: ${event.genres.join(', ')}
- Eras: ${event.eras.join(', ')}

Please create a playlist that:
1. Matches the event's mood and atmosphere
2. Incorporates the user's favorite genres and artists
3. Includes a mix of familiar songs and new recommendations
4. Maintains a good flow and energy level
5. Respects the user's preferred tempo and instruments when possible

Return the response as a JSON array of songs in the following format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "genre": "Genre",
    "year": "Year (optional)",
    "reason": "Brief explanation of why this song was chosen"
  }
]`;

    // Get ChatGPT response
    const chatGPTResponse = await openaiService.generateResponse(prompt);

    // Parse the response
    const suggestedSongs = JSON.parse(chatGPTResponse);

    // Format the suggested songs with required fields
    const formattedSuggestedSongs = suggestedSongs.map((song: any, index: number) => ({
      id: `generated-${Date.now()}-${index}`,
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      albumArt: `https://picsum.photos/200/200?random=${Date.now()}-${index}`,
      duration: 180, // Default duration
      videoId: null, // Will be fetched by the frontend
      likes: 0,
      dislikes: 0,
      isPlaying: false,
      addedBy: userId,
      addedAt: new Date().toISOString(),
      reason: song.reason
    }));

    // Update event with the suggested songs
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        playlist: formattedSuggestedSongs
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating event playlist:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update playlist',
        details: updateError
      });
    }

    res.json({ 
      message: 'Playlist generated and saved successfully',
      playlist: formattedSuggestedSongs
    });
  } catch (error) {
    console.error('Error in generatePersonalizedPlaylist:', error);
    res.status(500).json({ error: 'Failed to generate personalized playlist' });
  }
};

export const generatePlaylistOnJoin = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current event playlist
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get user's preferences and favorite songs
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select(`
        preferences:user_preferences(
          liked_genres,
          liked_eras,
          preferred_tempo,
          preferred_instruments,
          mood_preferences
        ),
        favoriteSongs:user_favorite_songs(
          track_name,
          artist,
          genre
        )
      `)
      .eq('id', userId)
      .single();

    // Get current playing track and next few tracks
    const currentPlaylist = event.playlist || [];
    const currentTrackIndex = currentPlaylist.findIndex((track: any) => track.isPlaying);
    const preservedTracks = currentPlaylist.slice(0, 0 + 3); // Keep current and next 2 tracks

    // Build a detailed prompt for ChatGPT
    const prompt = `Create a personalized playlist based on the following event details:

Event Details:
- Type: ${event.type}
- Mood: ${event.mood}
- Genres: ${event.genres.join(', ')}
- Eras: ${event.eras.join(', ')}

Currently Playing and Upcoming Songs:
${preservedTracks.map((track: any) => `- ${track.title} by ${track.artist} (${track.genre})`).join('\n')}

${userProfile && userProfile.preferences  ? `
User Preferences: 
- Favorite Genres: ${userProfile.preferences[0]?.liked_genres?.join(', ') || 'Not specified'}
- Favorite Eras: ${userProfile.preferences[0]?.liked_eras?.join(', ') || 'Not specified'}
- Preferred Tempo: ${userProfile.preferences[0]?.preferred_tempo || 'Not specified'}
- Preferred Instruments: ${userProfile.preferences[0]?.preferred_instruments?.join(', ') || 'Not specified'}
- Mood Preferences: ${JSON.stringify(userProfile.preferences[0]?.mood_preferences || {})}

User's Favorite Songs:
${userProfile && userProfile.favoriteSongs && userProfile.favoriteSongs?.map(song => `- ${song.track_name} by ${song.artist} (${song.genre})`).join('\n') || 'No favorite songs specified'}
` : 'No user preferences available'}

Please create a playlist that:
1. Matches the event's mood and atmosphere
2. ${userProfile ? 'Incorporates the user\'s favorite genres and artists when available' : 'Focuses on the event\'s specified genres and mood'}
3. Includes a mix of familiar songs and new recommendations
4. Maintains a good flow and energy level
5. ${userProfile ? 'Respects the user\'s preferred tempo and instruments when possible' : 'Matches the event\'s mood and energy level'}
6. Complements the currently playing and upcoming songs with 7 songs

Return the response as a JSON array of songs in the following format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "genre": "Genre",
    "year": "Year (optional)",
    "reason": "Brief explanation of why this song was chosen"
  }
]`;

    // Get ChatGPT response
    const chatGPTResponse = await openaiService.generateResponse(prompt);

    // Parse the response
    const suggestedSongs = JSON.parse(chatGPTResponse);

    // Format the suggested songs with required fields
    const formattedSuggestedSongs = suggestedSongs.map((song: any, index: number) => ({
      id: `generated-${Date.now()}-${index}`,
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      albumArt: `https://picsum.photos/200/200?random=${Date.now()}-${index}`,
      duration: 180, // Default duration
      videoId: null, // Will be fetched by the frontend
      likes: 0,
      dislikes: 0,
      isPlaying: false,
      addedBy: userId,
      addedAt: new Date().toISOString(),
      reason: song.reason
    }));

    // Update event with the suggested songs
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        playlist: formattedSuggestedSongs,
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating event playlist:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update playlist',
        details: updateError
      });
    }

    res.json({ 
      message: 'Playlist generated and saved successfully',
      playlist: formattedSuggestedSongs
    });
  } catch (error) {
    console.error('Error in generatePlaylistOnJoin:', error);
    res.status(500).json({ error: 'Failed to generate playlist on join' });
  }
}; 