import { Request, Response } from 'express';
import { getKnex } from '../config/knex.config.js';
import { Recommender } from '../shared-types/recommender.types.js';

export const getAll = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const recommenders = await knex<Recommender>('recommenders')
      .select('*')
      .orderBy('created_at', 'desc');
    
    res.json(recommenders);
  } catch (error) {
    console.error('Error fetching recommenders:', error);
    res.status(500).json({ message: 'Error fetching recommenders', error });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const recommender = await knex<Recommender>('recommenders')
      .select('*')
      .where({ recommender_id: parseInt(req.params.recommender_id) })
      .first();
    
    if (!recommender) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    
    res.json(recommender);
  } catch (error) {
    console.error('Error fetching recommender:', error);
    res.status(500).json({ message: 'Error fetching recommender', error });
  }
};

export const getByStudentId = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const recommenders = await knex<Recommender>('recommenders')
      .select('*')
      .where({ student_id: parseInt(req.params.user_id) })
      .orderBy('created_at', 'desc');
    
    res.json(recommenders || []);
  } catch (error) {
    console.error('Error in getByStudentId:', error);
    res.status(500).json({ message: 'Error fetching recommenders', error });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const [recommenderId] = await knex<Recommender>('recommenders')
      .insert(req.body);
    
    const newRecommender = await knex<Recommender>('recommenders')
      .select('*')
      .where({ recommender_id: recommenderId })
      .first();
    
    res.status(201).json(newRecommender);
  } catch (error) {
    console.error('Error creating recommender:', error);
    res.status(400).json({ message: 'Error creating recommender', error });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const updatedCount = await knex<Recommender>('recommenders')
      .where({ recommender_id: parseInt(req.params.id) })
      .update({
        ...req.body,
        updated_at: new Date()
      });
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    
    const updatedRecommender = await knex<Recommender>('recommenders')
      .select('*')
      .where({ recommender_id: parseInt(req.params.id) })
      .first();
    
    res.json(updatedRecommender);
  } catch (error) {
    console.error('Error updating recommender:', error);
    res.status(400).json({ message: 'Error updating recommender', error });
  }
};

export const deleteRecommender = async (req: Request, res: Response) => {
  try {
    const knex = getKnex();
    const deletedCount = await knex<Recommender>('recommenders')
      .where({ recommender_id: parseInt(req.params.id) })
      .del();
    
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    
    res.json({ message: 'Recommender deleted successfully' });
  } catch (error) {
    console.error('Error deleting recommender:', error);
    res.status(500).json({ message: 'Error deleting recommender', error });
  }
};