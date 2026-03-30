import passport from 'passport';
import GoogleTokenStrategy from 'passport-google-id-token';
import User from '../models/User.js';
import { USER_ROLES } from './constants.js';

export default function configurePassport() {
  // Google ID Token strategy - verifies ID token sent from client
  passport.use(
    new GoogleTokenStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
      },
      async (parsedToken, googleId, done) => {
        try {
          const payload = parsedToken && parsedToken.payload ? parsedToken.payload : parsedToken;

          const email = payload.email && payload.email.toLowerCase();
          const name = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
          const avatar = payload.picture || payload.picture_url || null;

          // Construct a normalized profile object to attach to req.user
          const profile = {
            googleId: payload.sub || googleId,
            email,
            name,
            avatar,
            payload,
          };

          return done(null, profile);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize / deserialize - not used because we use JWTs and session:false
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
}
