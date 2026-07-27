import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

/**
 * Infrastructure: Passport.js Google OAuth 2.0 Strategy Configuration.
 * HU-001 / T-032
 *
 * Configures Passport with the Google strategy. The verify callback is
 * intentionally minimal — it passes the Google profile to the route handler
 * where the use-case layer handles user creation/lookup, keeping business
 * logic out of infrastructure.
 */
export const configurePassport = (): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    // In test/development without Google credentials, skip Passport configuration
    // instead of crashing the entire app. The /auth/google routes will return 500
    // if called without a configured strategy, which is acceptable.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '⚠️ Google OAuth credentials not found. Skipping Passport Google strategy configuration.',
      );
    }
    return;
  }

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: Profile) => void,
      ) => {
        // Pass the raw Google profile to the controller.
        // Business logic (find/create user) lives in GoogleLoginUseCase.
        return done(null, profile);
      },
    ),
  );
};
