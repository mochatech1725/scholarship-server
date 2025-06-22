import { Request, Response } from 'express';
import Recommender from '../models/Recommender.js';

export const getAll = async (req: Request, res: Response) => {
  try {
    const recommenders = await Recommender.find();
    res.json(recommenders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommenders', error });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const recommender = await Recommender.findById(req.params.id);
    if (!recommender) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    res.json(recommender);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommender', error });
  }
};

export const getByUserId = async (req: Request, res: Response) => {
  try {
    const recommenders = await Recommender.find({ studentId: req.params.userId });
    res.json(recommenders || []);
  } catch (error) {
    console.error('Error in getByUserId:', error);
    res.status(500).json({ message: 'Error fetching recommenders', error });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const recommender = new Recommender(req.body);
    const savedRecommender = await recommender.save();
    res.status(201).json(savedRecommender);
  } catch (error) {
    res.status(400).json({ message: 'Error creating recommender', error });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const recommender = await Recommender.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!recommender) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    res.json(recommender);
  } catch (error) {
    res.status(400).json({ message: 'Error updating recommender', error });
  }
};

export const deleteRecommender = async (req: Request, res: Response) => {
  try {
    const recommender = await Recommender.findByIdAndDelete(req.params.id);
    if (!recommender) {
      return res.status(404).json({ message: 'Recommender not found' });
    }
    res.json({ message: 'Recommender deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recommender', error });
  }
};