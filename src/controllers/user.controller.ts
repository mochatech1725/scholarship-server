import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { User } from '../shared-types/user.types.js';
import { UserSearchPreferences } from '../shared-types/user-search-preferences.types.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const users = await knex<User>('users')
      .select('*')
      .orderBy('created_at', 'desc');
    
    // Fetch search preferences for each user
    const usersWithPreferences = await Promise.all(
      users.map(async (user) => {
        const searchPreferences = await knex<UserSearchPreferences>('user_search_preferences')
          .select('*')
          .where({ user_id: user.user_id })
          .first();
        
        return {
          ...user,
          searchPreferences: searchPreferences || null
        };
      })
    );
    
    res.json(usersWithPreferences);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const user = await knex<User>('users')
      .select('*')
      .where({ auth_user_id: req.params.userId })
      .first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch search preferences for the user
    const searchPreferences = await knex<UserSearchPreferences>('user_search_preferences')
      .select('*')
      .where({ user_id: user.user_id })
      .first();
    
    const userWithPreferences = {
      ...user,
      searchPreferences: searchPreferences || null
    };
    
    res.json(userWithPreferences);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

export const saveUserProfile = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    
    // First, get the user to find their user_id
    const user = await knex<User>('users')
      .select('user_id')
      .where({ auth_user_id: req.params.userId })
      .first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract search preferences from the request body
    const searchPrefs = req.body.searchPreferences;
    if (searchPrefs) {
      const searchPreferencesData = {
        user_id: user.user_id,
        target_type: searchPrefs.target_type,
        subject_areas: searchPrefs.subject_areas ? JSON.stringify(searchPrefs.subject_areas) : undefined,
        gender: searchPrefs.gender,
        ethnicity: searchPrefs.ethnicity,
        academic_gpa: searchPrefs.academic_gpa,
        essay_required: searchPrefs.essay_required,
        recommendations_required: searchPrefs.recommendations_required,
        academic_level: searchPrefs.academic_level,
        updated_at: new Date()
      };

      // Update or insert search preferences
      const existingPrefs = await knex('user_search_preferences')
        .where({ user_id: user.user_id })
        .first();

      if (existingPrefs) {
        await knex('user_search_preferences')
          .where({ user_id: user.user_id })
          .update(searchPreferencesData);
      } else {
        await knex('user_search_preferences')
          .insert(searchPreferencesData);
      }
    }
    
    // Update user's updated_at timestamp
    await knex<User>('users')
      .where({ auth_user_id: req.params.userId })
      .update({ updated_at: new Date() });
    
    // Get updated user with search preferences
    const updatedUser = await knex<User>('users')
      .select('*')
      .where({ auth_user_id: req.params.userId })
      .first();

    const searchPreferences = await knex<UserSearchPreferences>('user_search_preferences')
      .select('*')
      .where({ user_id: user.user_id })
      .first();
    
    const userWithPreferences = {
      ...updatedUser,
      searchPreferences: searchPreferences || null
    };
    
    res.json(userWithPreferences);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(400).json({ message: 'Error updating user profile', error });
  }
}; 