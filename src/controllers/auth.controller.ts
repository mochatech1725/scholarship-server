import { Request, Response } from 'express';
import Person from '../models/Person.js';
import type { IPerson } from '../models/Person.js';

// Auth0 profile endpoint
export const getProfile = async (req: Request, res: Response) => {
  try {
    // The user is already authenticated via Auth0 middleware
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find or create user in our database based on Auth0 sub
    let user = await Person.findOne({ auth0Id: auth0User.sub });
    
    if (!user) {
      // Create new user record if they don't exist
      user = new Person({
        auth0Id: auth0User.sub,
        firstName: auth0User.given_name || '',
        lastName: auth0User.family_name || '',
        emailAddress: auth0User.email || '',
        // Note: We don't store password since Auth0 handles authentication
      });
      
      await user.save();
    }

    res.json({
      user: {
        id: user._id,
        auth0Id: user.auth0Id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber
      },
      auth0Profile: auth0User
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error retrieving profile', error });
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
    res.status(500).json({ message: 'Error checking authentication', error });
  }
};