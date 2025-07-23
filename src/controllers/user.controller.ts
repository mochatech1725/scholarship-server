import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { User } from '../types/user.types.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const users = await knex<User>('users')
      .select('*')
      .orderBy('created_at', 'desc');
    
    res.json(users);
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
    
    res.json(user);
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
    const searchPrefs = req.body.userPreferences?.searchPreferences;
    if (searchPrefs) {
      const searchPreferencesData = {
        target_type: searchPrefs.targetType,
        subject_areas: searchPrefs.subjectAreas ? JSON.stringify(searchPrefs.subjectAreas) : undefined,
        gender: searchPrefs.gender,
        ethnicity: searchPrefs.ethnicity,
        academic_gpa: searchPrefs.academicGPA,
        essay_required: searchPrefs.essayRequired,
        recommendation_required: searchPrefs.recommendationRequired,
        academic_level: searchPrefs.academicLevel,
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
          .insert({
            user_id: user.user_id,
            ...searchPreferencesData
          });
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

    const searchPreferences = await knex('user_search_preferences')
      .select('*')
      .where({ user_id: user.user_id })
      .first();
    
    res.json({
      ...updatedUser,
      searchPreferences: searchPreferences ? {
        targetType: searchPreferences.target_type,
        subjectAreas: searchPreferences.subject_areas ? JSON.parse(searchPreferences.subject_areas) : [],
        gender: searchPreferences.gender,
        ethnicity: searchPreferences.ethnicity,
        academicGPA: searchPreferences.academic_gpa,
        essayRequired: searchPreferences.essay_required,
        recommendationRequired: searchPreferences.recommendation_required,
        academicLevel: searchPreferences.academic_level
      } : null
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(400).json({ message: 'Error updating user profile', error });
  }
}; 