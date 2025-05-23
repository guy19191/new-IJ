import passport from 'passport';
import { Strategy as SpotifyStrategy } from 'passport-spotify';
import { Strategy as YouTubeStrategy } from 'passport-youtube-v3';
import { Strategy as AppleStrategy } from 'passport-apple';
import { supabase } from '../config/database';
import { generateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Spotify Strategy
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      callbackURL: process.env.SPOTIFY_CALLBACK_URL!
    },
    async (accessToken, refreshToken, profile: any, done: any) => {
      try {
        if (!profile || !profile.id) {
          console.error('Invalid Spotify profile:', profile);
          return done(new Error('Invalid Spotify profile'));
        }

        // Add tokens to profile
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;

        console.log('Spotify profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          photos: profile.photos?.length
        });

        // First check if user exists by provider
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', profile.email)
          .eq('provider', 'spotify')
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching user:', fetchError);
          return done(fetchError);
        }

        let user;
        if (!existingUser) {
          const userId = uuidv4();
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              display_name: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
              provider: 'spotify',
              provider_data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                provider_id: profile.id,
                provider_name: 'spotify',
                last_login: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return done(createError);
          }
          user = newUser;
        } else {
          // Update existing user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              display_name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider_data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                provider_id: profile.id,
                provider_name: 'spotify',
                last_login: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user:', updateError);
            return done(updateError);
          }
          user = updatedUser;
        }

        if (!user) {
          console.error('No user returned from Supabase operations');
          return done(new Error('Failed to create/update user'));
        }

        console.log('User authenticated successfully:', user.id);
        done(null, user);
      } catch (error) {
        console.error('Spotify strategy error:', error);
        done(error as Error);
      }
    }
  )
);

// YouTube Strategy
passport.use(
  new YouTubeStrategy(
    {
      clientID: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      callbackURL: process.env.YOUTUBE_CALLBACK_URL!,
      scope: ['https://www.googleapis.com/auth/youtube.readonly']
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        if (!profile || !profile.id) {
          console.error('Invalid YouTube profile:', profile);
          return done(new Error('Invalid YouTube profile'));
        }

        // Add tokens to profile
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;

        console.log('YouTube profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          photos: profile.photos?.length
        });

        // First check if user exists
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', profile.email)
          .eq('provider', 'youtube')
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error fetching user:', fetchError);
          return done(fetchError);
        }

        let user;
        if (!existingUser) {
          const userId = uuidv4();

          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              display_name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider: 'youtube',
              provider_data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                provider_id: profile.id,
                provider_name: 'youtube',
                last_login: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return done(createError);
          }
          user = newUser;
        } else {
          // Update existing user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              display_name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              provider_data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                provider_id: profile.id,
                provider_name: 'youtube',
                last_login: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user:', updateError);
            return done(updateError);
          }
          user = updatedUser;
        }

        if (!user) {
          console.error('No user returned from Supabase operations');
          return done(new Error('Failed to create/update user'));
        }

        console.log('User authenticated successfully:', user.id);
        done(null, user);
      } catch (error) {
        console.error('YouTube strategy error:', error);
        done(error as Error);
      }
    }
  )
);

// Apple Strategy
// passport.use(
//   new AppleStrategy(
//     {
//       clientID: process.env.APPLE_CLIENT_ID!,
//       teamID: process.env.APPLE_TEAM_ID!,
//       keyID: process.env.APPLE_KEY_ID!,
//       privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH!,
//       callbackURL: process.env.APPLE_CALLBACK_URL!,
//       scope: ['name', 'email']
//     },
//     async (req: any, accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
//       try {
//         const { data: user, error } = await supabase
//           .from('users')
//           .upsert({
//             id: profile.id,
//             display_name: profile.name?.firstName || profile.email,
//             avatar: null,
//             provider: 'apple'
//           })
//           .select()
//           .single();

//         done(null, user);
//       } catch (error) {
//         done(error as Error);
//       }
//     }
//   )
// );

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport; 