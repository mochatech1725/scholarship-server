import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { Application } from '../shared-types/application.types.js';
import { Recommendation } from '../shared-types/recommendation.types.js';
import { Essay } from '../shared-types/essay.types.js';


async function populateApplicationWithRelatedData(application: Application): Promise<Application> {
  const knex = getKnex();
  
  // Fetch recommendations
  const recommendations = await knex<Recommendation>('recommendations')
    .select('*')
    .where({ application_id: application.application_id });
  
  // Fetch essays
  const essays = await knex<Essay>('essays')
    .select('*')
    .where({ application_id: application.application_id });
  
  return {
    ...application,
    recommendations,
    essays
  };
}

async function populateApplicationsWithRelatedData(applications: Application[]): Promise<Application[]> {
  return Promise.all(applications.map(app => populateApplicationWithRelatedData(app)));
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const applications = await knex<Application>('applications')
      .select('*')
      .orderBy('created_at', 'desc');
    
    const populatedApplications = await populateApplicationsWithRelatedData(applications);
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getByStudentId = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const applications = await knex<Application>('applications')
      .select('*')
      .where({ student_id: parseInt(req.params.user_id)})
      .orderBy('created_at', 'desc');
    
    const populatedApplications = await populateApplicationsWithRelatedData(applications);
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error in getByStudentId:', error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const application = await knex<Application>('applications')
      .select('*')
      .where({ application_id: parseInt(req.params.application_id) })
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
    const [applicationId] = await knex<Application>('applications')
      .insert(req.body);
    
    const newApplication = await knex<Application>('applications')
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
    const updatedCount = await knex<Application>('applications')
      .where({ application_id: parseInt(req.params.application_id) })
      .update({
        ...req.body,
        updated_at: new Date()
      });
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const updatedApplication = await knex<Application>('applications')
      .select('*')
      .where({ application_id: parseInt(req.params.application_id) })
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
    const deletedCount = await knex<Application>('applications')
      .where({ application_id: parseInt(req.params.application_id) })
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