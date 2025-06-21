import express from 'express';
import { getProfile, checkAuth } from '../controllers/auth.controller.js';
import authenticateUser from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`Auth route hit: ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});


// Auth0 profile endpoint - requires authentication
router.get('/profile', authenticateUser, getProfile);

// Check authentication status - requires authentication
router.get('/me', authenticateUser, checkAuth);

export default router; 