import express from 'express';
import { login, logout, createUser } from '../controllers/auth.controller.js';
import authenticateUser from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`Auth route hit: ${req.method} ${req.path}`);
  //console.log('Headers:', req.headers);
  next();
});


// Auth0 login endpoint - requires authentication
router.get('/login', authenticateUser, login);

// Create new user endpoint - requires authentication
router.post('/register', authenticateUser, createUser);

router.post('/logout', logout);

export default router; 