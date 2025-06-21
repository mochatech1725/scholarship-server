import express from 'express';
import { login } from '../controllers/auth.controller.js';
import authenticateUser from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`Auth route hit: ${req.method} ${req.path}`);
  //console.log('Headers:', req.headers);
  next();
});

// Test route without authentication
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth route is working', 
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Auth0 login endpoint - requires authentication
router.get('/login', authenticateUser, login);

export default router; 