-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    provider_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    provider VARCHAR(50) NOT NULL,
    liked_genres TEXT[] DEFAULT '{}',
    liked_eras TEXT[] DEFAULT '{}',
    attended_events UUID[] DEFAULT '{}',
    can_host BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, provider)
);

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mood VARCHAR(50) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    genres TEXT[] DEFAULT '{}',
    eras TEXT[] DEFAULT '{}',
    host_id UUID REFERENCES users(id),
    guests UUID[] DEFAULT '{}',
    playlist JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    now_playing JSONB,
    energy FLOAT DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    track_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, track_id, user_id)
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events"
    ON events FOR SELECT
    USING (true);

CREATE POLICY "Hosts can create events"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND can_host = true
        )
    );

CREATE POLICY "Hosts can update their events"
    ON events FOR UPDATE
    USING (
        host_id = auth.uid()
    );

-- Votes policies
CREATE POLICY "Users can view votes"
    ON votes FOR SELECT
    USING (true);

CREATE POLICY "Users can create votes"
    ON votes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM events
            WHERE id = event_id
            AND (
                host_id = auth.uid()
                OR auth.uid() = ANY(guests)
            )
        )
    );

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
