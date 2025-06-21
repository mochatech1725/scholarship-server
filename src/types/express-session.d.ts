import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: any;
    auth0Sub?: string;
  }
} 