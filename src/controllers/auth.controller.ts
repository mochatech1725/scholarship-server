import { Request, Response } from 'express';
import User from '../models/User.js';

// Auth0 profile endpoint
export const getProfile = async (req: Request, res: Response) => {
  console.log('getProfile called');
  console.log('req.auth:', req.auth);
  console.log('req.auth?.payload:', req.auth?.payload);
  
  try {
    // The user is already authenticated via Auth0 middleware
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      console.log('No auth0User found, returning 401');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find or create user in our database based on Auth0 sub
    let user = await User.findOne({ userId: auth0User.sub });
    console.log('Database query result:', user);

    if (!user) {
      console.log('No user found for auth0Id:', auth0User.sub);
      return res.status(404).json({ 
        message: 'User not found in database',
        auth0Sub: auth0User.sub
      });
    } else {
      console.log('Existing user found:', user._id);
    }

    const response = {
      user: {
        ...user.toObject()
      },
      auth0Profile: auth0User
    };

    console.log('Sending response:', response);
    console.log('Response JSON:', JSON.stringify(response, null, 2));
    
    res.json(response);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error retrieving profile', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Check authentication status
export const checkAuth = async (req: Request, res: Response) => {
  try {
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      return res.status(401).json({ 
        message: 'User not authenticated',
        authenticated: false 
      });
    }

    res.json({ 
      message: 'User is authenticated',
      authenticated: true,
      user: auth0User 
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    res.status(500).json({ message: 'Error checking authentication', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};