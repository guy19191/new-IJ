import { supabase } from '../config/database';

async function resetDatabase() {
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

    // Drop all tables and recreate them
    const { error: resetError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all tables if they exist
        DROP TABLE IF EXISTS public.chatgpt_interactions CASCADE;
        DROP TABLE IF EXISTS public.user_preferences CASCADE;
        DROP TABLE IF EXISTS public.user_playlists CASCADE;
        DROP TABLE IF EXISTS public.user_favorite_songs CASCADE;
        DROP TABLE IF EXISTS public.events CASCADE;
        DROP TABLE IF EXISTS public.users CASCADE;

        -- Create users table
        CREATE TABLE public.users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          display_name TEXT NOT NULL,
          avatar TEXT,
          provider TEXT NOT NULL,
          email TEXT,
          provider_data JSONB DEFAULT '{}',
          liked_genres TEXT[] DEFAULT '{}',
          liked_eras TEXT[] DEFAULT '{}',
          attended_events UUID[] DEFAULT '{}',
          can_host BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for users
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Create policies for users
        CREATE POLICY "Users can view their own data"
          ON public.users FOR SELECT
          USING (id = (auth.uid())::uuid);

        CREATE POLICY "Users can update their own data"
          ON public.users FOR UPDATE
          USING (id = (auth.uid())::uuid);

        -- Create events table
        CREATE TABLE public.events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          mood VARCHAR(50) NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          provider VARCHAR(50) NOT NULL,
          genres TEXT[] DEFAULT '{}',
          eras TEXT[] DEFAULT '{}',
          host_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
        CREATE POLICY "Anyone can view events"
          ON public.events FOR SELECT
          USING (true);

        CREATE POLICY "Hosts can create events"
          ON public.events FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE id = (auth.uid())::uuid
              AND can_host = true
            )
          );

        CREATE POLICY "Hosts can update their events"
          ON public.events FOR UPDATE
          USING (
            host_id = (auth.uid())::uuid
          );

        -- Create user_favorite_songs table
        CREATE TABLE public.user_favorite_songs (
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
        CREATE POLICY "Users can view their own favorite songs"
          ON public.user_favorite_songs FOR SELECT
          USING (user_id = (auth.uid())::uuid);

        CREATE POLICY "Users can manage their own favorite songs"
          ON public.user_favorite_songs FOR ALL
          USING (user_id = (auth.uid())::uuid);

        -- Create user_playlists table
        CREATE TABLE public.user_playlists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          tracks JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for user_playlists
        ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

        -- Create policies for user_playlists
        CREATE POLICY "Users can view their own playlists"
          ON public.user_playlists FOR SELECT
          USING (user_id = (auth.uid())::uuid);

        CREATE POLICY "Users can manage their own playlists"
          ON public.user_playlists FOR ALL
          USING (user_id = (auth.uid())::uuid);

        -- Create user_preferences table
        CREATE TABLE public.user_preferences (
          user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
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
        CREATE POLICY "Users can view their own preferences"
          ON public.user_preferences FOR SELECT
          USING (user_id = (auth.uid())::uuid);

        CREATE POLICY "Users can manage their own preferences"
          ON public.user_preferences FOR ALL
          USING (user_id = (auth.uid())::uuid);

        -- Create chatgpt_interactions table
        CREATE TABLE public.chatgpt_interactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable RLS for chatgpt_interactions
        ALTER TABLE public.chatgpt_interactions ENABLE ROW LEVEL SECURITY;

        -- Create policies for chatgpt_interactions
        CREATE POLICY "Users can view their own ChatGPT interactions"
          ON public.chatgpt_interactions FOR SELECT
          USING (user_id = (auth.uid())::uuid);

        CREATE POLICY "Users can create their own ChatGPT interactions"
          ON public.chatgpt_interactions FOR INSERT
          WITH CHECK (user_id = (auth.uid())::uuid);
      `
    });

    if (resetError) {
      console.error('Error resetting database:', resetError);
      throw resetError;
    }

    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Run the function
resetDatabase().catch(console.error); 