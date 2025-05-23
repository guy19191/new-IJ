import { supabase } from '../config/database';

async function createTables() {
  try {
    // Create exec_sql function if it doesn't exist
    const { error: execSqlError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `
    });

    if (execSqlError) {
      console.error('Error creating exec_sql function:', execSqlError);
      throw execSqlError;
    }

    // Create all tables in one go
    const { error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table
        CREATE TABLE IF NOT EXISTS public.users (
          id TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          avatar TEXT,
          provider TEXT NOT NULL,
          email TEXT,
          provider_data JSONB DEFAULT '{}',
          liked_genres TEXT[] DEFAULT '{}',
          liked_eras TEXT[] DEFAULT '{}',
          attended_events TEXT[] DEFAULT '{}',
          can_host BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for users
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Create policies for users
        DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
        CREATE POLICY "Users can view their own data"
          ON public.users FOR SELECT
          USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
        CREATE POLICY "Users can update their own data"
          ON public.users FOR UPDATE
          USING (auth.uid() = id);

        -- Create events table
        CREATE TABLE IF NOT EXISTS public.events (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          mood VARCHAR(50) NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          provider VARCHAR(50) NOT NULL,
          genres TEXT[] DEFAULT '{}',
          eras TEXT[] DEFAULT '{}',
          host_id UUID REFERENCES auth.users(id),
          guests UUID[] DEFAULT '{}',
          playlist JSONB DEFAULT '[]',
          suggestions JSONB DEFAULT '[]',
          now_playing JSONB,
          energy FLOAT DEFAULT 0.5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for events
        ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

        -- Create policies for events
        DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
        CREATE POLICY "Anyone can view events"
          ON public.events FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Hosts can create events" ON public.events;
        CREATE POLICY "Hosts can create events"
          ON public.events FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE id = auth.uid()
              AND can_host = true
            )
          );

        DROP POLICY IF EXISTS "Hosts can update their events" ON public.events;
        CREATE POLICY "Hosts can update their events"
          ON public.events FOR UPDATE
          USING (
            host_id = auth.uid()
          );

        -- Create user_favorite_songs table
        CREATE TABLE IF NOT EXISTS public.user_favorite_songs (
          user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
          track_id TEXT NOT NULL,
          track_name TEXT NOT NULL,
          artist TEXT NOT NULL,
          genre TEXT,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, track_id)
        );

        -- Enable RLS for user_favorite_songs
        ALTER TABLE public.user_favorite_songs ENABLE ROW LEVEL SECURITY;

        -- Create policies for user_favorite_songs
        DROP POLICY IF EXISTS "Users can view their own favorite songs" ON public.user_favorite_songs;
        CREATE POLICY "Users can view their own favorite songs"
          ON public.user_favorite_songs FOR SELECT
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage their own favorite songs" ON public.user_favorite_songs;
        CREATE POLICY "Users can manage their own favorite songs"
          ON public.user_favorite_songs FOR ALL
          USING (auth.uid() = user_id);

        -- Create user_playlists table
        CREATE TABLE IF NOT EXISTS public.user_playlists (
          id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
          user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          tracks JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for user_playlists
        ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

        -- Create policies for user_playlists
        DROP POLICY IF EXISTS "Users can view their own playlists" ON public.user_playlists;
        CREATE POLICY "Users can view their own playlists"
          ON public.user_playlists FOR SELECT
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage their own playlists" ON public.user_playlists;
        CREATE POLICY "Users can manage their own playlists"
          ON public.user_playlists FOR ALL
          USING (auth.uid() = user_id);

        -- Create user_preferences table
        CREATE TABLE IF NOT EXISTS public.user_preferences (
          user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
          liked_genres TEXT[] DEFAULT '{}',
          liked_eras TEXT[] DEFAULT '{}',
          preferred_tempo FLOAT,
          preferred_instruments TEXT[] DEFAULT '{}',
          mood_preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for user_preferences
        ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

        -- Create policies for user_preferences
        DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
        CREATE POLICY "Users can view their own preferences"
          ON public.user_preferences FOR SELECT
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
        CREATE POLICY "Users can manage their own preferences"
          ON public.user_preferences FOR ALL
          USING (auth.uid() = user_id);

        -- Create chatgpt_interactions table
        CREATE TABLE IF NOT EXISTS public.chatgpt_interactions (
          id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
          user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
          event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for chatgpt_interactions
        ALTER TABLE public.chatgpt_interactions ENABLE ROW LEVEL SECURITY;

        -- Create policies for chatgpt_interactions
        DROP POLICY IF EXISTS "Users can view their own ChatGPT interactions" ON public.chatgpt_interactions;
        CREATE POLICY "Users can view their own ChatGPT interactions"
          ON public.chatgpt_interactions FOR SELECT
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can create their own ChatGPT interactions" ON public.chatgpt_interactions;
        CREATE POLICY "Users can create their own ChatGPT interactions"
          ON public.chatgpt_interactions FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      `
    });

    if (tablesError) {
      console.error('Error creating tables:', tablesError);
      throw tablesError;
    }

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run the function
createTables().catch(console.error); 