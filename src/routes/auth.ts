import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken } from '../middleware/auth';
import { supabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Helper function to create or get user
async function createOrGetUser(profile: any, provider: string) {
  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', profile.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const userData = {
      id: profile.id,
      display_name: profile.displayName || profile.name || 'Anonymous User',
      avatar: profile.photos?.[0]?.value || null,
      provider,
      email: profile.emails?.[0]?.value || null,
      provider_data: {
        access_token: profile.accessToken,
        refresh_token: profile.refreshToken,
        provider_id: profile.id,
        provider_name: provider,
        last_login: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    if (!existingUser) {
      // Create new user with additional fields
      const newUser = {
        ...userData,
        created_at: new Date().toISOString(),
        liked_genres: [],
        liked_eras: [],
        attended_events: [],
        can_host: true, // Allow all new users to host initially
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return createdUser;
    } else {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return updatedUser;
    }
  } catch (error) {
    console.error('Error in createOrGetUser:', error);
    throw error;
  }
}

// Helper function to get OAuth URL
const getOAuthUrl = (strategy: string, options: any) => {
  return new Promise((resolve, reject) => {
    passport.authenticate(strategy, options, (err: any, user: any, info: any) => {
      if (err) return reject(err);
      resolve(info?.redirectUrl);
    })({});
  });
};

// Spotify OAuth
router.get('/spotify/start',
  (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_CALLBACK_URL) {
      return res.status(500).json({ message: 'Spotify OAuth configuration is missing' });
    }
    passport.authenticate('spotify', {
      scope: ['user-read-email', 'user-read-private', 'playlist-read-private']
    })(req, res, next);
  }
);

router.get('/spotify/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('spotify', { session: false }, async (err: any, profile: any, info: any) => {
      if (err) {
        console.error('Spotify auth error:', err);
        return res.redirect(`${frontendUrl}/auth/spotify/callback?error=authentication_failed`);
      }
      if (!profile) {
        console.error('No profile returned from Spotify auth');
        return res.redirect(`${frontendUrl}/auth/spotify/callback?error=authentication_failed`);
      }
      try {
        const user = await createOrGetUser(profile, 'spotify');
        const token = generateToken(user.id, 'spotify');
        const redirectUrl = `${frontendUrl}/auth/spotify/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error in Spotify callback:', error);
        res.redirect(`${frontendUrl}/auth/spotify/callback?error=user_creation_failed`);
      }
    })(req, res, next);
  }
);

// YouTube OAuth
router.get('/youtube/start',
  (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_CALLBACK_URL) {
      console.error('Missing YouTube OAuth configuration:', {
        clientId: !!process.env.YOUTUBE_CLIENT_ID,
        clientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
        callbackUrl: !!process.env.YOUTUBE_CALLBACK_URL
      });
      return res.status(500).json({ message: 'YouTube OAuth configuration is missing' });
    }
    passport.authenticate('youtube', {
      scope: ['https://www.googleapis.com/auth/youtube.readonly']
    })(req, res, next);
  }
);

router.get('/youtube/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('youtube', { session: false }, async (err: any, profile: any, info: any) => {
      if (err) {
        console.error('YouTube auth error:', err);
        return res.redirect(`${frontendUrl}/auth/youtube/callback?error=authentication_failed`);
      }
      if (!profile) {
        console.error('No profile returned from YouTube auth');
        return res.redirect(`${frontendUrl}/auth/youtube/callback?error=authentication_failed`);
      }
      try {
        const user = await createOrGetUser(profile, 'youtube');
        const token = generateToken(user.id, 'youtube');
        const redirectUrl = `${frontendUrl}/auth/youtube/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error in YouTube callback:', error);
        res.redirect(`${frontendUrl}/auth/youtube/callback?error=user_creation_failed`);
      }
    })(req, res, next);
  }
);

// Apple Music OAuth
router.get('/apple/start',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('apple', {
      scope: ['name', 'email']
    })(req, res, next);
  }
);

router.get('/apple/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('apple', { session: false }, async (err: any, profile: any, info: any) => {
      if (err) {
        console.error('Apple auth error:', err);
        return res.redirect(`${frontendUrl}/auth/apple/callback?error=authentication_failed`);
      }
      if (!profile) {
        console.error('No profile returned from Apple auth');
        return res.redirect(`${frontendUrl}/auth/apple/callback?error=authentication_failed`);
      }
      try {
        const user = await createOrGetUser(profile, 'apple');
        const token = generateToken(user.id, 'apple');
        const redirectUrl = `${frontendUrl}/auth/apple/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error in Apple callback:', error);
        res.redirect(`${frontendUrl}/auth/apple/callback?error=user_creation_failed`);
      }
    })(req, res, next);
  }
);

// Get current user
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router; 