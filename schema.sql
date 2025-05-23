-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar TEXT,
    provider TEXT NOT NULL,
    liked_genres TEXT[] DEFAULT '{}',
    liked_eras TEXT[] DEFAULT '{}',
    attended_events TEXT[] DEFAULT '{}',
    can_host BOOLEAN DEFAULT true,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Create chatgpt_interactions table
CREATE TABLE IF NOT EXISTS public.chatgpt_interactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    mood TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    provider TEXT DEFAULT 'spotify',
    genres TEXT[] DEFAULT '{}',
    eras TEXT[] DEFAULT '{}',
    host_id TEXT,
    guests TEXT[] DEFAULT '{}',
    playlist JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    now_playing JSONB DEFAULT '{}',
    energy FLOAT DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, track_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for events table
CREATE POLICY "Anyone can view events"
    ON public.events FOR SELECT
    USING (true);

CREATE POLICY "Hosts can create events"
    ON public.events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Hosts can update their events"
    ON public.events FOR UPDATE
    USING (true);

-- Create policies for votes table
CREATE POLICY "Users can view votes"
    ON public.votes FOR SELECT
    USING (true);

CREATE POLICY "Users can create votes"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their votes"
    ON public.votes FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for new tables
CREATE POLICY "Users can view their own favorite songs"
    ON public.user_favorite_songs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorite songs"
    ON public.user_favorite_songs FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own playlists"
    ON public.user_playlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own playlists"
    ON public.user_playlists FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ChatGPT interactions"
    ON public.chatgpt_interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ChatGPT interactions"
    ON public.chatgpt_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for user_playlists updated_at
CREATE TRIGGER update_user_playlists_updated_at
    BEFORE UPDATE ON public.user_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 