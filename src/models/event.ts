import { Pool } from 'pg';
import { config } from '../config';

interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  likes: number;
  dislikes: number;
}

interface Event {
  id: string;
  name: string;
  mood: string;
  date: Date;
  provider: string;
  genres: string[];
  eras: string[];
  hostId: string;
  guests: string[];
  playlist: Track[];
  suggestions: any[];
  nowPlaying: Track | null;
  energy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class EventModel {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url
    });
  }

  async getEventById(id: string): Promise<Event | null> {
    const result = await this.pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapEventFromDb(result.rows[0]);
  }

  async updateEventPlaylist(eventId: string, playlist: Track[]): Promise<void> {
    await this.pool.query(
      'UPDATE events SET playlist = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(playlist), eventId]
    );
  }

  private mapEventFromDb(row: any): Event {
    return {
      id: row.id,
      name: row.name,
      mood: row.mood,
      date: new Date(row.date),
      provider: row.provider,
      genres: row.genres || [],
      eras: row.eras || [],
      hostId: row.host_id,
      guests: row.guests || [],
      playlist: row.playlist || [],
      suggestions: row.suggestions || [],
      nowPlaying: row.now_playing,
      energy: row.energy,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
} 