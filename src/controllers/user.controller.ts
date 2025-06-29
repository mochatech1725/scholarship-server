import { Request, Response } from 'express';
import User from '../models/User.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({userId: req.params.userId})
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

export const saveUserProfile = async (req: Request, res: Response) => {
  try {
    // Filter out _id field from profile data to prevent immutable field error
    const { _id, ...profileData } = req.body;
    
    const user = await User.findOneAndUpdate(
      {userId: req.params.userId},
      { profile: profileData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user profile', error });
  }
}; 