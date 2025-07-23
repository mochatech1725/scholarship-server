import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { IApplication } from '../types/application.types.js';
import { IRecommendation } from '../types/recommendation.types.js';
import { IEssay } from '../types/essay.types.js';


async function populateApplicationWithRelatedData(application: IApplication): Promise<IApplication> {
  const knex = getKnex();
  
  // Fetch recommendations
  const recommendations = await knex<IRecommendation>('recommendations')
    .select('*')
    .where({ application_id: application.application_id });
  
  // Fetch essays
  const essays = await knex<IEssay>('essays')
    .select('*')
    .where({ application_id: application.application_id });
  
  return {
    ...application,
    recommendations,
    essays
  };
}

async function populateApplicationsWithRelatedData(applications: IApplication[]): Promise<IApplication[]> {
  return Promise.all(applications.map(app => populateApplicationWithRelatedData(app)));
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const applications = await knex<IApplication>('applications')
      .select('*')
      .orderBy('created_at', 'desc');
    
    const populatedApplications = await populateApplicationsWithRelatedData(applications);
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getByUserId = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const applications = await knex<IApplication>('applications')
      .select('*')
      .where({ student_id: req.params.userId })
      .orderBy('created_at', 'desc');
    
    const populatedApplications = await populateApplicationsWithRelatedData(applications);
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error in getByUserId:', error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const application = await knex<IApplication>('applications')
      .select('*')
      .where({ application_id: parseInt(req.params.id) })
      .first();
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const populatedApplication = await populateApplicationWithRelatedData(application);
    res.json(populatedApplication);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application', error });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const [applicationId] = await knex<IApplication>('applications')
      .insert(req.body);
    
    const newApplication = await knex<IApplication>('applications')
      .select('*')
      .where({ application_id: applicationId })
      .first();
    
    if (!newApplication) {
      return res.status(500).json({ message: 'Error retrieving created application' });
    }
    
    const populatedApplication = await populateApplicationWithRelatedData(newApplication);
    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(400).json({ message: 'Error creating application', error });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const updatedCount = await knex<IApplication>('applications')
      .where({ application_id: parseInt(req.params.id) })
      .update({
        ...req.body,
        updated_at: new Date()
      });
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const updatedApplication = await knex<IApplication>('applications')
      .select('*')
      .where({ application_id: parseInt(req.params.id) })
      .first();
    
    if (!updatedApplication) {
      return res.status(500).json({ message: 'Error retrieving updated application' });
    }
    
    const populatedApplication = await populateApplicationWithRelatedData(updatedApplication);
    res.json(populatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(400).json({ message: 'Error updating application', error });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const deletedCount = await knex<IApplication>('applications')
      .where({ application_id: parseInt(req.params.id) })
      .del();
    
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Error deleting application', error });
  }
}; 