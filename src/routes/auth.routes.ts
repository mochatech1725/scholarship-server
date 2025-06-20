import express from 'express';
import { getProfile, checkAuth } from '../controllers/auth.controller.js';
import authenticateUser from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth0 profile endpoint - requires authentication
router.get('/profile', authenticateUser, getProfile);

// Check authentication status - requires authentication
router.get('/me', authenticateUser, checkAuth);

export default router; 