import { Request, Response } from 'express';
import dotenv from 'dotenv';

import AIScholarshipSearch from '../ai/ai.service.js';

dotenv.config();

const aiService = new AIScholarshipSearch();

export const findScholarships = async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(process.env.MAX_RESULTS || '10')
    const filters = req.body.filters || req.body;

    // Validate input
    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({
        message: 'Filters object is required',
        error: 'INVALID_INPUT'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: 'OpenAI API key not configured',
        error: 'CONFIGURATION_ERROR'
      });
    }

    const result = await aiService.findScholarships({
      filters,
      maxResults
    });

    res.json(result);

  } catch (error) {
    console.error('Error in findScholarships:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return res.status(500).json({
        message: 'Error processing request with AI service',
        error: 'AI_SERVICE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      message: 'Internal server error while searching scholarships',
      error: 'INTERNAL_ERROR'
    });
  }
};

export const getScholarshipSources = async (req: Request, res: Response) => {
  try {
    const result = aiService.getScholarshipSources();
    res.json(result);
  } catch (error) {
    console.error('Error getting scholarship sources:', error);
    res.status(500).json({
      message: 'Error fetching scholarship sources',
      error: 'INTERNAL_ERROR'
    });
  }
};