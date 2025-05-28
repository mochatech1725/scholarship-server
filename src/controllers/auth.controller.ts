import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Person, { IPerson } from '../models/Person';
import { JwtPayload } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, emailAddress, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await Person.findOne({ emailAddress });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new Person({
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const payload: JwtPayload = { userId: user._id.toString() };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailAddress, password } = req.body;

    // Find user
    const user = await Person.findOne({ emailAddress });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload: JwtPayload = { userId: user._id.toString() };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
}; 