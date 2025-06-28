import { Request, Response } from 'express';
import dotenv from 'dotenv';
// eventually maybe move this into RAG
import { 
  ScholarshipSearchRequest
} from '../types/scholarship.types.js';
import AIScholarshipSearch from '../ai/ai.service.js';

dotenv.config();

// Initialize AI service
const aiService = new AIScholarshipSearch();

// Main search function
export const findScholarships = async (req: Request, res: Response) => {
  try {
    const { 
      keywords, 
      maxResults = parseInt(process.env.MAX_RESULTS || '10'), 
      includeDeadlines = true, 
      minAmount, 
      maxAmount,
      useRealScraping = true 
    }: ScholarshipSearchRequest = req.body;

    // Validate input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        message: 'Keywords array is required and must not be empty',
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
      keywords,
      maxResults,
      includeDeadlines,
      minAmount,
      maxAmount,
      useRealScraping
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

// Get available scholarship sources
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