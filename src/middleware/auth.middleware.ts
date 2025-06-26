import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import type { Request, Response, NextFunction } from 'express';
import auth0Config from "../config/auth0.config.js";

// console.log('Auth0 Config:', {
//   audience: auth0Config.audience,
//   issuerBaseURL: auth0Config.issuerBaseUrl,
//   hasAudience: !!auth0Config.audience,
//   hasIssuer: !!auth0Config.issuerBaseUrl
// });

const authenticateUser = auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseUrl,
  tokenSigningAlg: 'RS256'
});

// Enhanced authentication middleware with error handling
const authenticateUserWithErrorHandling = (req: Request, res: Response, next: NextFunction) => {
  // Log authentication attempts for security monitoring
  console.log(`Auth attempt: ${req.method} ${req.path} - IP: ${req.ip}`);
  
  authenticateUser(req, res, (err) => {
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