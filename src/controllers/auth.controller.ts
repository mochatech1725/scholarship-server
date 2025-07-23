import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { User } from '../types/user.types.js';

export const login = async (req: Request, res: Response) => {
  console.log('login called');
  
  try {
    // The user is already authenticated via Auth0 middleware
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      console.log('No auth0User found, returning 401');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const knex = getKnex();
    
    // Find user in our database based on Auth0 sub
    const user = await knex<User>('users').where('auth_user_id', auth0User.sub).first();

    if (!user) {
      console.log('No user found for auth0Id:', auth0User.sub, '- returning 404');
      return res.status(404).json({ 
        message: 'User not found. Please register first.',
        error: 'USER_NOT_FOUND'
      });
    }

    console.log('Existing user found:', user.user_id);

    const response = {
      user: {
        ...user
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

    const knex = getKnex();

    // Check if user already exists
    const existingUser = await knex<User>('users').where('auth_user_id', auth0User.sub).first();
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Extract name parts safely
    const auth0Name = typeof auth0User.name === 'string' ? auth0User.name : '';
    const nameParts = auth0Name.split(' ');
    const firstName = auth0User.given_name as string || nameParts[0] || '';
    const lastName = auth0User.family_name as string || nameParts.slice(1).join(' ') || '';

    // Create new user from Auth0 profile
    const userData = {
      auth_user_id: auth0User.sub as string,
      first_name: firstName,
      last_name: lastName,
      email_address: auth0User.email as string || ''
    };

    const [savedUser] = await knex<User>('users')
      .insert(userData)
      .returning('*');

    // If profile data is provided, create search preferences
    if (req.body.profile?.userPreferences?.searchPreferences) {
      const searchPrefs = req.body.profile.userPreferences.searchPreferences;
      const searchPreferencesData = {
        user_id: savedUser.user_id,
        target_type: searchPrefs.targetType,
        subject_areas: searchPrefs.subjectAreas ? JSON.stringify(searchPrefs.subjectAreas) : undefined,
        gender: searchPrefs.gender,
        ethnicity: searchPrefs.ethnicity,
        academic_gpa: searchPrefs.academicGPA,
        essay_required: searchPrefs.essayRequired,
        recommendation_required: searchPrefs.recommendationRequired,
        academic_level: searchPrefs.academicLevel
      };

      await knex('user_search_preferences').insert(searchPreferencesData);
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};