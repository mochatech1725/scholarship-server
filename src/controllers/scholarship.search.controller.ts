import { Request, Response } from 'express';
import ScholarshipSearchService from '../services/scholarship-search.service.js';
import { SearchService, initKnexFromAWSSecret } from '../services/aws.db.service.js';
import { Scholarship } from '../shared-types/scholarship.types.js';
import { MAX_SCHOLARSHIP_SEARCH_RESULTS, NODE_ENV } from '../utils/constants.js';

let searchService: ScholarshipSearchService;

export async function initScholarshipSearchController(secretArn: string) {
  const knex = await initKnexFromAWSSecret(secretArn);
  const searchDbService = new SearchService(knex);
  searchService = new ScholarshipSearchService(searchDbService);
}

/**
 * Convert scholarship results, handling eligibility field conversion
 * @param scholarships - Array of scholarship results from the service
 * @returns Processed scholarship results with eligibility as string
 */
const convertScholarshipItems = (scholarships: Scholarship[]): Scholarship[] => {
  return scholarships.map(scholarship => {
    let eligibility = scholarship.eligibility;
    if (eligibility && typeof eligibility === 'object') {
      if (Array.isArray(eligibility)) {
        eligibility = (eligibility as any[]).join(', ');
      } else {
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
    res.json({ sources: ['mysql'] });
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
    const sources = [...new Set(result.scholarships.map(s => s.source))];
    console.log('🔍 Scholarship sources found:', sources);
    console.log('📊 Total scholarships:', result.scholarships.length);
    const convertedScholarships = convertScholarshipItems(result.scholarships);
    res.json({
      success: true,
      data: {
        scholarships: convertedScholarships,
        totalFound: result.totalFound,
        searchTimestamp: new Date().toISOString()
      },
      metadata: {
        sourcesUsed: ['mysql'],
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