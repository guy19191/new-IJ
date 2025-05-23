import { OpenAI } from 'openai';
import { config } from '../config';

interface PlaylistRequest {
  eventDetails: {
    type: string;
    date: string;
    location: string;
    description: string;
  };
  userPreferences: {
    favoriteGenres: string[];
    favoriteArtists: string[];
    mood: string;
  };
}

interface Song {
  title: string;
  artist: string;
  genre: string;
  year?: number;
}

export class PlaylistService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async generatePlaylist(request: PlaylistRequest): Promise<Song[]> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a music expert that creates personalized playlists based on event details and user preferences. Return exactly 10 songs in a JSON array format."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(content);
        // Handle both possible response formats
        const songs = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.songs;
        if (!Array.isArray(songs)) {
          throw new Error('Invalid response format');
        }
        return songs;
      } catch (parseError) {
        console.error('Error parsing ChatGPT response:', parseError);
        throw new Error('Failed to parse playlist response');
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      throw error;
    }
  }

  private buildPrompt(request: PlaylistRequest): string {
    return `Create a playlist of 10 songs for the following event and user preferences:

Event Details:
- Type: ${request.eventDetails.type}
- Date: ${request.eventDetails.date}
- Location: ${request.eventDetails.location}
- Description: ${request.eventDetails.description}

User Preferences:
- Favorite Genres: ${request.userPreferences.favoriteGenres.join(', ')}
- Favorite Artists: ${request.userPreferences.favoriteArtists.join(', ')}
- Mood: ${request.userPreferences.mood}

Please return the response as a JSON array of songs in the following format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "genre": "Genre",
    "year": "Year (optional)"
  }
]`;
  }
} 