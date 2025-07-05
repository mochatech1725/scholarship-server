import { Request, Response } from 'express';
import dotenv from 'dotenv';

import EnhancedAIService, { EnhancedSearchRequest } from '../ai/enhanced-ai.service.js';
import { ScholarshipItem } from '../types/searchPreferences.types.js';

dotenv.config();

const enhancedAIService = new EnhancedAIService();

/**
 * Convert scholarship results, handling eligibility field conversion
 * @param scholarships - Array of scholarship results from the service
 * @returns Processed scholarship results with eligibility as string
 */
const convertScholarshipItems = (scholarships: ScholarshipItem[]): ScholarshipItem[] => {
  return scholarships.map(scholarship => {
    let eligibility = scholarship.eligibility;
    
    // If eligibility is an object, convert to string by concatenating values
    if (eligibility && typeof eligibility === 'object') {
      if (Array.isArray(eligibility)) {
        eligibility = (eligibility as any[]).join(', ');
      } else {
        // Handle object case - concatenate all values
        eligibility = Object.values(eligibility as Record<string, any>).join(', ');
      }
    }
    
    return {
      ...scholarship,
      eligibility
    };
  });
};

export const getScholarshipSources = async (req: Request, res: Response) => {
  try {
    // If you want to keep this endpoint, you can implement a similar method in EnhancedAIService
    res.json({ sources: [] });
  } catch (error) {
    console.error('Error getting scholarship sources:', error);
    res.status(500).json({
      message: 'Error fetching scholarship sources',
      error: 'INTERNAL_ERROR'
    });
  }
};



export const findScholarships = async (req: Request, res: Response) => {
  try {
    const { searchCriteria, maxResults = parseInt(process.env.MAX_RESULTS || '25')} = req.body;

    if (!searchCriteria || typeof searchCriteria !== 'object') {
      return res.status(400).json({
        message: 'Search criteria object is required',
        error: 'INVALID_INPUT'
      });
    }

    const searchRequest: EnhancedSearchRequest = {
      searchCriteria,
      maxResults
    };

    const result = await enhancedAIService.searchScholarships(searchRequest);
    
    // Convert scholarship results to handle eligibility field conversion
    const convertedScholarships = convertScholarshipItems(result.scholarships);
    
    res.json({
      success: true,
      data: {
        scholarships: convertedScholarships,
        totalFound: result.metadata.totalFound,
        searchTimestamp: new Date().toISOString()
      },
      metadata: {
        sourcesUsed: result.metadata.servicesUsed,
        aiModel: 'AWS Bedrock',
        processingTime: `${result.metadata.searchTime}ms`,
        sources: result.sources,
        analysis: result.analysis
      }
    });

  } catch (error) {
    console.error('Error in enhanced search:', error);
    res.status(500).json({
      message: 'Error in enhanced scholarship search',
      error: 'ENHANCED_SEARCH_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};