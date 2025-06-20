import { Request, Response } from 'express';
import Scholarship from '../models/Scholarship.js';
import type { IScholarship } from '../models/Scholarship.js';

export const getAllScholarships = async (req: Request, res: Response) => {
  try {
    const scholarships = await Scholarship.find();
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scholarships', error });
  }
};

export const getScholarshipById = async (req: Request, res: Response) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }
    res.json(scholarship);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scholarship', error });
  }
};

export const createScholarship = async (req: Request, res: Response) => {
  try {
    const scholarship = new Scholarship(req.body);
    const savedScholarship = await scholarship.save();
    res.status(201).json(savedScholarship);
  } catch (error) {
    res.status(400).json({ message: 'Error creating scholarship', error });
  }
};

export const updateScholarship = async (req: Request, res: Response) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }
    res.json(scholarship);
  } catch (error) {
    res.status(400).json({ message: 'Error updating scholarship', error });
  }
};

export const deleteScholarship = async (req: Request, res: Response) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }
    res.json({ message: 'Scholarship deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting scholarship', error });
  }
}; 