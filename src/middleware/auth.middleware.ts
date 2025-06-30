import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import type { Request, Response, NextFunction } from 'express';
import auth0Config from "../config/auth0.config.js";

// Check if Auth0 is properly configured
const isAuth0Configured = auth0Config.audience && auth0Config.issuerBaseUrl && 
                          auth0Config.audience !== "" && auth0Config.issuerBaseUrl !== "";

console.log('Auth0 is configured:', isAuth0Configured);

// Create auth middleware only if Auth0 is configured
const authenticateUser = isAuth0Configured ? auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseUrl,
  tokenSigningAlg: 'RS256'
}) : null;

// Enhanced authentication middleware with error handling
const authenticateUserWithErrorHandling = (req: Request, res: Response, next: NextFunction) => {
  // Log authentication attempts for security monitoring
  console.log(`Auth attempt: ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // If Auth0 is not configured, skip authentication for development
  if (!isAuth0Configured) {
    console.log('Auth0 not configured - skipping authentication for development');
    // Add a mock user for development
    (req as any).auth = {
      payload: {
        sub: 'dev-user',
        iss: 'dev-issuer',
        aud: 'dev-audience'
      },
      header: {},
      token: 'mock-token'
    };
    return next();
  }
  
  // Use Auth0 authentication if configured
  authenticateUser!(req, res, (err) => {
    if (err) {
      console.error('Authentication error:', {
        error: err.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Return appropriate error responses
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          error: 'Invalid or missing token',
          message: 'Please provide a valid authentication token',
          timestamp: new Date().toISOString()
        });
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your authentication token has expired. Please log in again.',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to authenticate your request',
        timestamp: new Date().toISOString()
      });
    }
    
    // Log successful authentication
    console.log(`Auth success: ${req.method} ${req.path} - User: ${req.auth?.payload?.sub}`);
    next();
  });
};

export default authenticateUserWithErrorHandling;