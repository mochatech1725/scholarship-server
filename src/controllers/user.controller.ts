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
          .where({ student_id: user.user_id }) 
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

    // Create new user from request body
    const userData = {
      auth_user_id: auth0User.sub as string,
      first_name: req.body.first_name || '',
      last_name: req.body.last_name || '',
      email_address: req.body.email_address || auth0User.email as string || '',
      phone_number: req.body.phone_number || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const [savedUser] = await knex<User>('users')
      .insert(userData)
      .returning('*');

    res.status(201).json({
      message: 'User created successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const user = await knex<User>('users')
      .select('*')
      .where({ auth_user_id: req.params.auth_user_id })
      .first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch search preferences for the user
    const searchPreferences = await knex<UserSearchPreferences>('user_search_preferences')
      .select('*')
      .where({ student_id: user.user_id })
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

export const getByStudentId = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const user = await knex<User>('users')
      .select('*')
      .where({ user_id: parseInt(req.params.student_id) })
      .first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch search preferences for the user
    const searchPreferences = await knex<UserSearchPreferences>('user_search_preferences')
      .select('*')
      .where({ student_id: parseInt(req.params.student_id) })
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
        student_id: user.user_id,
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
        .where({ student_id: user.user_id })
        .first();

      if (existingPrefs) {
        await knex('user_search_preferences')
          .where({ student_id: user.user_id })
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
      .where({ student_id: user.user_id })
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

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const auth0User = req.auth?.payload;
    
    if (!auth0User) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const knex = getKnex();
    
    // Get user
    const user = await knex<User>('users')
      .select('*')
      .where({ auth_user_id: auth0User.sub })
      .first();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all applications for the user
    const applications = await knex('applications')
      .select('*')
      .where({ student_id: user.user_id })
      .orderBy('due_date', 'asc');

    // Calculate statistics
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => 
      app.status === 'Not Started' || app.status === 'In Progress'
    ).length;
    const submittedApplications = applications.filter(app => 
      app.status === 'Submitted' || app.status === 'Awarded' || app.status === 'Not Awarded'
    ).length;
    const totalValue = applications.reduce((sum, app) => sum + (app.max_award || 0), 0);

    // Get upcoming deadlines (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingDeadlines = applications
      .filter(app => {
        const dueDate = new Date(app.due_date);
        return dueDate >= now && dueDate <= thirtyDaysFromNow && 
               (app.status === 'Not Started' || app.status === 'In Progress');
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    // Calculate notification count
    const notificationCount = Math.min(upcomingDeadlines.length + pendingApplications, 9);

    res.json({
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email_address: user.email_address
      },
      stats: {
        totalApplications,
        pendingApplications,
        submittedApplications,
        totalValue,
        notificationCount,
        newMatchesCount: Math.min(pendingApplications, 3) // Placeholder for now
      },
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error });
  }
}; 