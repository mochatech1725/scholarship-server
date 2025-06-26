import { Request, Response } from 'express';
import User from '../models/User.js';

export const login = async (req: Request, res: Response) => {
  console.log('login called');
  
  try {
    // The user is already authenticated via Auth0 middleware
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      console.log('No auth0User found, returning 401');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find user in our database based on Auth0 sub
    const user = await User.findOne({ userId: auth0User.sub });

    if (!user) {
      console.log('No user found for auth0Id:', auth0User.sub, '- returning 404');
      return res.status(404).json({ 
        message: 'User not found. Please register first.',
        error: 'USER_NOT_FOUND'
      });
    }

    console.log('Existing user found:', user._id);

    const response = {
      user: {
        ...user.toObject()
      },
      auth0Profile: auth0User
    };

    // console.log('Sending response:', response);
    // console.log('Response JSON:', JSON.stringify(response, null, 2));
    
    res.json(response);
    //console.log('Response sent successfully');
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error retrieving profile', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // With JWT authentication, logout is handled client-side
    // The client should discard the JWT token
    res.json({ 
      message: 'Logged out successfully',
      note: 'Please discard your JWT token on the client side'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId: auth0User.sub });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Extract name parts safely
    const auth0Name = typeof auth0User.name === 'string' ? auth0User.name : '';
    const nameParts = auth0Name.split(' ');
    const firstName = auth0User.given_name || nameParts[0] || '';
    const lastName = auth0User.family_name || nameParts.slice(1).join(' ') || '';

    // Create new user from Auth0 profile
    const newUser = new User({
      userId: auth0User.sub,
      firstName,
      lastName,
      emailAddress: auth0User.email || '',
      profile: req.body.profile || {} // Allow optional profile data
    });

    const savedUser = await newUser.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: savedUser.toObject()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};