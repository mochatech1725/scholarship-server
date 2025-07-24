import { SearchService } from './aws.db.service.js';
import { Scholarship } from '../shared-types/scholarship.types.js';
import { SearchCriteria, SearchOptions } from '../shared-types/scholarship-search.types.js';

// Use a local type to add relevanceScore for in-memory operations
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ScoredScholarship extends Scholarship { relevanceScore?: number; }

export class ScholarshipSearchService {
  private searchService: SearchService;

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  /**
   * Search scholarships with advanced filtering and ranking
   */
  async searchScholarships(
    criteria: SearchCriteria, 
    options: SearchOptions = {}
  ): Promise<{
    scholarships: Scholarship[];
    totalFound: number;
    searchTime: number;
    filters: {
      applied: string[];
      available: string[];
    };
  }> {
    const startTime = Date.now();
    try {
      // Get results from MySQL via Knex
      let scholarships = await this.searchService.searchScholarships(criteria);

      // Apply additional filters (e.g., expired deadlines)
      scholarships = this.applyFilters(scholarships, criteria, options);

      // Sort results
      scholarships = (scholarships as ScoredScholarship[]);
      scholarships = this.sortScholarships(scholarships, options.sortBy || 'relevance', options.sortOrder || 'desc');

      // Calculate relevance scores
      scholarships = (scholarships as ScoredScholarship[]).map(scholarship => ({
        ...scholarship,
        relevanceScore: this.calculateRelevanceScore(scholarship, criteria)
      }));

      // Limit results
      const maxResults = options.maxResults || 25;
      const finalResults = scholarships.slice(0, maxResults);

      const searchTime = Date.now() - startTime;

      return {
        scholarships: finalResults,
        totalFound: finalResults.length,
        searchTime,
        filters: {
          applied: this.getAppliedFilters(criteria),
          available: this.getAvailableFilters(scholarships)
        }
      };
    } catch (error) {
      console.error('Scholarship search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply minimal post-processing filters (most filtering now done at DB level)
   */
  private applyFilters(
    scholarships: Scholarship[], 
    criteria: SearchCriteria, 
    options: SearchOptions
  ): Scholarship[] {
    return scholarships.filter(scholarship => {
      // Only filter by deadline if specified (not handled by DB)
      if (!options.includeExpired && scholarship.deadline) {
        const deadline = new Date(scholarship.deadline);
        if (deadline < new Date()) return false;
      }

      return true;
    });
  }

  /**
   * Sort scholarships by specified criteria
   */
  private sortScholarships(
    scholarships: ScoredScholarship[], 
    sortBy: string, 
    sortOrder: string
  ): ScoredScholarship[] {
    return scholarships.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'deadline':
          comparison = this.compareDates(a.deadline, b.deadline);
          break;
        case 'amount':
          comparison = this.compareAmounts(a.max_award, b.max_award);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'relevance':
        default:
          comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Compare dates for sorting
   */
  private compareDates(dateA?: string, dateB?: string): number {
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getTime() - b.getTime();
  }

  /**
   * Compare amounts for sorting
   */
  private compareAmounts(amountA?: number, amountB?: number): number {
    if (!amountA && !amountB) return 0;
    if (!amountA) return 1;
    if (!amountB) return -1;
    
    return amountA - amountB;
  }

  /**
   * Calculate relevance score based on search criteria
   */
  private calculateRelevanceScore(scholarship: Scholarship, criteria: SearchCriteria): number {
    let score = 0;
    
    // Build search text and terms for scoring
    const searchText = this.buildSearchTextForScoring(scholarship);
    const searchTerms = this.buildSearchTermsForScoring(criteria);
    
    // Calculate matches for comprehensive text search
    if (searchTerms.length > 0) {
      const matchedTerms = searchTerms.filter((term: string) => 
        searchText.toLowerCase().includes(term.toLowerCase())
      );
      
      // Base score for having any matches
      if (matchedTerms.length > 0) {
        score += 10;
        
        // Bonus for matching more terms
        const matchRatio = matchedTerms.length / searchTerms.length;
        score += Math.round(matchRatio * 20);
        
        // Bonus for exact matches in title
        const title = (scholarship.title || '').toLowerCase();
        const titleMatches = searchTerms.filter((term: string) => 
          title.includes(term.toLowerCase())
        );
        score += titleMatches.length * 5;
      }
    }
    
    // Legacy scoring for backward compatibility
    // Keyword matching in title and description
    if (criteria.keywords) {
      const keywords = criteria.keywords.toLowerCase().split(' ');
      const title = (scholarship.title || '').toLowerCase();
      const description = (scholarship.description || '').toLowerCase();
      
      keywords.forEach(keyword => {
        if (title.includes(keyword)) score += 10;
        if (description.includes(keyword)) score += 5;
      });
    }
    // Academic level matching
    if (criteria.academic_level && scholarship.academic_level) {
      if (scholarship.academic_level.toLowerCase().includes(criteria.academic_level.toLowerCase())) {
        score += 7;
      }
    }

    // Geographic restrictions matching
    if (criteria.geographic_restrictions && scholarship.geographic_restrictions) {
      if (scholarship.geographic_restrictions.toLowerCase().includes(criteria.geographic_restrictions.toLowerCase())) {
        score += 6;
      }
    }

    // Demographics matching
    if (criteria.gender && scholarship.gender) {
      if (scholarship.gender.toLowerCase() === criteria.gender.toLowerCase()) {
        score += 5;
      }
    }

    if (criteria.ethnicity && scholarship.ethnicity) {
      if (scholarship.ethnicity.toLowerCase() === criteria.ethnicity.toLowerCase()) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Build searchable text from scholarship fields for scoring
   */
  private buildSearchTextForScoring(scholarship: Scholarship): string {
    const textParts: string[] = [];
    
    if (scholarship.eligibility) textParts.push(scholarship.eligibility);
    if (scholarship.description) textParts.push(scholarship.description);
    if (scholarship.title) textParts.push(scholarship.title);
    if (scholarship.organization) textParts.push(scholarship.organization);
    
    return textParts.join(' ');
  }

  /**
   * Build search terms from criteria for scoring
   */
  private buildSearchTermsForScoring(criteria: SearchCriteria): string[] {
    const terms: string[] = [];
    
    // Add subject areas
    if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
      terms.push(...criteria.subjectAreas);
    }
    
    // Add target type (if not 'Both')
    if (criteria.target_type && criteria.target_type !== 'Both') {
      terms.push(criteria.target_type);
    }
    
    // Add ethnicity
    if (criteria.ethnicity) {
      terms.push(criteria.ethnicity);
    }
    
    // Add gender
    if (criteria.gender) {
      terms.push(criteria.gender);
    }
    
    // Add keywords (split into individual words)
    if (criteria.keywords) {
      const keywordTerms = criteria.keywords
        .split(/\s+/)
        .filter(word => word.length > 0);
      terms.push(...keywordTerms);
    }
    
    return terms;
  }

  /**
   * Get list of applied filters
   */
  private getAppliedFilters(criteria: SearchCriteria): string[] {
    const filters: string[] = [];
    
    if (criteria.keywords) filters.push(`Keywords: ${criteria.keywords}`);
    if (criteria.academic_level) filters.push(`Academic Level: ${criteria.academic_level}`);
    if (criteria.subjectAreas?.length) filters.push(`Subjects: ${criteria.subjectAreas.join(', ')}`);
    if (criteria.target_type && criteria.target_type !== 'Both') filters.push(`Target Type: ${criteria.target_type}`);
    if (criteria.gender) filters.push(`Gender: ${criteria.gender}`);
    if (criteria.ethnicity) filters.push(`Ethnicity: ${criteria.ethnicity}`);
    if (criteria.geographic_restrictions) filters.push(`Location: ${criteria.geographic_restrictions}`);
    
    return filters;
  }

  /**
   * Get available filter options from results
   */
  private getAvailableFilters(scholarships: Scholarship[]): string[] {
    const filters: string[] = [];
    
    // Collect unique values for each filter type
    const academicLevels = new Set<string>();
    const countries = new Set<string>();
    const organizations = new Set<string>();
    
    scholarships.forEach(scholarship => {
      if (scholarship.academic_level) academicLevels.add(scholarship.academic_level);
      if (scholarship.country) countries.add(scholarship.country);
      if (scholarship.organization) organizations.add(scholarship.organization);
    });
    
    if (academicLevels.size > 0) filters.push(`Academic Levels: ${Array.from(academicLevels).join(', ')}`);
    if (countries.size > 0) filters.push(`Countries: ${Array.from(countries).join(', ')}`);
    if (organizations.size > 0) filters.push(`Organizations: ${Array.from(organizations).join(', ')}`);
    
    return filters;
  }

  /**
   * Get scholarship by ID
   */
  async getScholarshipById(id: string): Promise<Scholarship | null> {
    try {
      const item = await this.searchService.getScholarshipById(id);
      if (!item) return null;
      
      return item;
    } catch (error) {
      console.error('Error getting scholarship by ID:', error);
      return null;
    }
  }

  /**
   * Get scholarship statistics
   */
  async getStatistics(): Promise<{
    totalScholarships: number;
    totalAmount: number;
    averageAmount: number;
    countries: string[];
    academicLevels: string[];
  }> {
    try {
      // This would need to be implemented in DynamoDB service
      // For now, return placeholder data
      return {
        totalScholarships: 0,
        totalAmount: 0,
        averageAmount: 0,
        countries: [],
        academicLevels: []
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

export default ScholarshipSearchService; 