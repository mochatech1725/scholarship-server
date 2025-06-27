import { Request, Response } from 'express';
import Application from '../models/Application.js';

export const getAll = async (req: Request, res: Response) => {
  try {
    const applications = await Application.find();
    console.log(applications);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getByUserId = async (req: Request, res: Response) => {
  try {
    console.log('Fetching applications for userId:', req.params.userId);
    
    const applications = await Application.find({ studentId: req.params.userId });
    
    console.log('Found applications:', applications.length);
    console.log('First application essays:', applications[0]?.essays?.length || 0);
    console.log('First application recommendations:', applications[0]?.recommendations?.length || 0);
    
    res.json(applications);
  } catch (error) {
    console.error('Error in getByUserId:', error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const application = new Application(req.body);
    const savedApplication = await application.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(400).json({ message: 'Error creating application', error });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(400).json({ message: 'Error updating application', error });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting application', error });
  }
}; 