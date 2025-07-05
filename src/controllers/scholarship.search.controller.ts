import { Request, Response } from 'express';
import ScholarshipSearchService from '../services/scholarship-search.service.js';
import { ScholarshipItem } from '../types/searchPreferences.types.js';
import { MAX_SCHOLARSHIP_SEARCH_RESULTS, NODE_ENV } from '../utils/constants.js';

const searchService = new ScholarshipSearchService();

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
    // Return available data sources
    res.json({ sources: ['dynamodb'] });
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
    const { searchCriteria, maxResults = MAX_SCHOLARSHIP_SEARCH_RESULTS} = req.body;

    if (!searchCriteria || typeof searchCriteria !== 'object') {
      return res.status(400).json({
        message: 'Search criteria object is required',
        error: 'INVALID_INPUT'
      });
    }

    const result = await searchService.searchScholarships(searchCriteria, { maxResults });
    
    // Debug: Log the sources of scholarships
    const sources = [...new Set(result.scholarships.map(s => s.source))];
    console.log('🔍 Scholarship sources found:', sources);
    console.log('📊 Total scholarships:', result.scholarships.length);
    
    // Convert scholarship results to handle eligibility field conversion
    const convertedScholarships = convertScholarshipItems(result.scholarships);
    
    res.json({
      success: true,
      data: {
        scholarships: convertedScholarships,
        totalFound: result.totalFound,
        searchTimestamp: new Date().toISOString()
      },
      metadata: {
        sourcesUsed: ['dynamodb'],
        processingTime: `${result.searchTime}ms`,
        filters: result.filters
      }
    });

  } catch (error) {
    console.error('Error in scholarship search:', error);
    res.status(500).json({
      message: 'Error in scholarship search',
      error: 'SEARCH_ERROR',
      details: NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};