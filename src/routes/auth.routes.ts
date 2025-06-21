import express from 'express';
import { login, logout } from '../controllers/auth.controller.js';
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

router.post('/logout', logout);

export default router; 