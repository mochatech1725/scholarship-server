import AWSBedrockService from '../services/aws-bedrock.service.js';
import AWSComprehendService from '../services/aws-comprehend.service.js';
import ScholarshipSearchService from '../services/scholarship-search.service.js';
import { ScholarshipItem, SearchCriteria } from '../types/searchPreferences.types.js';

export interface EnhancedSearchRequest {
  searchCriteria: SearchCriteria;
  maxResults?: number;
}

export interface EnhancedSearchResponse {
  scholarships: ScholarshipItem[];
  sources: {
    dynamodb: number;
    ai: number;
    scraping: number;
  };
  analysis?: {
    entities: any[];
    keyPhrases: any[];
    sentiment: any;
  };
  metadata: {
    totalFound: number;
    searchTime: number;
    servicesUsed: string[];
  };
}

export class EnhancedAIService {
  private bedrockService: AWSBedrockService;
  private comprehendService: AWSComprehendService;
  private searchService: ScholarshipSearchService;

  constructor() {
    this.bedrockService = new AWSBedrockService();
    this.comprehendService = new AWSComprehendService();
    this.searchService = new ScholarshipSearchService();
  }

  /**
   * Enhanced scholarship search using search service and AI
   * @param request - Enhanced search request
   * @returns Promise with comprehensive search results
   */
  async searchScholarships(request: EnhancedSearchRequest): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();
    const servicesUsed: string[] = [];
    let allScholarships: ScholarshipItem[] = [];

    try {
      // 1. Search DynamoDB using the search service
      try {
        const searchResults = await this.searchService.searchScholarships(
          request.searchCriteria,
          { maxResults: request.maxResults || 25 }
        );
        allScholarships = searchResults.scholarships;
        servicesUsed.push('dynamodb');
      } catch (error) {
        console.error('Search service failed:', error);
      }

      // 2. Use AWS Bedrock for AI-generated recommendations
      try {
        const aiResults = await this.bedrockService.searchScholarshipsWithAI(request.searchCriteria);
        const convertedAIResults = this.convertAIResultsToScholarships(aiResults);
        allScholarships.push(...convertedAIResults);
        servicesUsed.push('bedrock-ai');
      } catch (error) {
        console.error('Bedrock AI search failed:', error);
      }

      // 3. Analyze results with Comprehend if requested
      let analysis = undefined;
      if (allScholarships.length > 0) {
        try {
          const combinedText = allScholarships
            .map(s => `${s.title} ${s.description} ${s.eligibility}`)
            .join(' ');
          analysis = await this.comprehendService.analyzeScholarshipText(combinedText);
          servicesUsed.push('comprehend');
        } catch (error) {
          console.error('Comprehend analysis failed:', error);
        }
      }

      // 4. Deduplicate and rank results
      const deduplicatedResults = this.deduplicateScholarships(allScholarships);
      const rankedResults = this.rankScholarships(deduplicatedResults, request.searchCriteria);
      const finalResults = rankedResults.slice(0, request.maxResults || 25);

      const searchTime = Date.now() - startTime;

      return {
        scholarships: finalResults,
        sources: {
          dynamodb: allScholarships.filter(s => s.source === 'dynamodb').length,
          ai: allScholarships.filter(s => s.source === 'bedrock-ai').length,
          scraping: 0, // No more scraping
        },
        analysis,
        metadata: {
          totalFound: finalResults.length,
          searchTime,
          servicesUsed
        }
      };

    } catch (error) {
      console.error('Enhanced search failed:', error);
      throw new Error(`Enhanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert AI results to scholarship format
   * @param aiResults - Raw AI results
   * @returns Array of scholarship results
   */
  private convertAIResultsToScholarships(aiResults: any): ScholarshipItem[] {
    const scholarships: ScholarshipItem[] = [];

    try {
      let results = aiResults;
      if (Array.isArray(aiResults)) {
        results = aiResults;
      } else if (aiResults.scholarships && Array.isArray(aiResults.scholarships)) {
        results = aiResults.scholarships;
      } else if (aiResults.rawResponse) {
        const extracted = this.extractScholarshipsFromText(aiResults.rawResponse);
        results = extracted;
      }

      for (const item of results) {
        if (item && typeof item === 'object') {
          const scholarship: ScholarshipItem = {
            title: item.title || item.name || 'AI Generated Scholarship',
            description: item.description || item.desc || 'No description available',
            minAward: this.parseAmount(item.amount || item.award_amount),
            maxAward: this.parseAmount(item.amount || item.award_amount),
            deadline: item.deadline || item.due_date || 'Deadline not specified',
            eligibility: item.eligibility || item.requirements || 'Eligibility requirements not specified',
            url: item.url || item.link || '',
            source: 'bedrock-ai',
            gender: item.gender,
            ethnicity: item.ethnicity,
            academicLevel: item.educationLevel || item.level,
            academicGPA: item.gpa || item.minimum_gpa,
            essayRequired: item.essayRequired || item.essay_required || false,
            recommendationRequired: item.recommendationRequired || item.recommendation_required || false,
            relevanceScore: this.calculateRelevanceScore(item, this.createDefaultSearchFilters())
          };
          scholarships.push(scholarship);
        }
      }
    } catch (error) {
      console.error('Error converting AI results:', error);
    }

    return scholarships;
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amount: string | number | undefined): number | undefined {
    if (typeof amount === 'number') return amount;
    if (!amount) return undefined;
    
    const cleaned = amount.toString().replace(/[$,€£¥]/g, '').replace(/,/g, '');
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : undefined;
  }

  /**
   * Extract scholarships from text using regex patterns
   * @param text - Text to extract from
   * @returns Array of scholarship objects
   */
  private extractScholarshipsFromText(text: string): any[] {
    const scholarships: any[] = [];
    try {
      const scholarshipBlocks = text.split(/\n\s*\n/);
      for (const block of scholarshipBlocks) {
        const lines = block.split('\n');
        const scholarship: any = {};
        for (const line of lines) {
          const [key, ...valueParts] = line.split(':').map(s => s.trim());
          const value = valueParts.join(':').trim();
          if (key && value) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
            scholarship[normalizedKey] = value;
          }
        }
        if (scholarship.title || scholarship.name) {
          scholarships.push(scholarship);
        }
      }
    } catch (error) {
      console.error('Error extracting scholarships from text:', error);
    }
    return scholarships;
  }

  /**
   * Deduplicate scholarships based on title and organization
   * @param scholarships - Array of scholarships
   * @returns Deduplicated array
   */
  private deduplicateScholarships(scholarships: ScholarshipItem[]): ScholarshipItem[] {
    const seen = new Set<string>();
    const unique: ScholarshipItem[] = [];
    for (const scholarship of scholarships) {
      const key = `${scholarship.title.toLowerCase()}_${scholarship.source}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(scholarship);
      }
    }
    return unique;
  }

  /**
   * Create a default SearchCriteria object
   * @returns Default SearchCriteria
   */
  private createDefaultSearchFilters(): SearchCriteria {
    return {
      subjectAreas: [],
      keywords: '',
      academicLevel: null,
      targetType: null,
      gender: null,
      ethnicity: null,
      academicGPA: null,
      essayRequired: null,
      recommendationRequired: null,
      geographicRestrictions: null
    };
  }

  /**
   * Calculate relevance score for a scholarship
   * @param scholarship - Scholarship item
   * @param criteria - Search criteria
   * @returns Relevance score
   */
  private calculateRelevanceScore(scholarship: any, criteria: SearchCriteria): number {
    let score = 0;
    
    // Basic scoring
    if (scholarship.title) score += 1;
    if (scholarship.description) score += 1;
    if (scholarship.amount) score += 1;
    
    // Comprehensive text search scoring
    const searchText = this.buildSearchText(scholarship);
    const searchTerms = this.buildSearchTerms(criteria);
    
    if (searchTerms.length > 0) {
      const matchedTerms = searchTerms.filter(term => 
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
        const titleMatches = searchTerms.filter(term => 
          title.includes(term.toLowerCase())
        );
        score += titleMatches.length * 5;
      }
    }
    
    // Legacy scoring for backward compatibility
    if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
      const majorMatch = criteria.subjectAreas.some(major => 
        scholarship.academicLevel?.toLowerCase().includes(major.toLowerCase())
      );
      if (majorMatch) score += 10;
    }
    if (criteria.gender && scholarship.gender?.toLowerCase().includes(criteria.gender.toLowerCase())) {
      score += 5;
    }
    if (criteria.ethnicity && scholarship.ethnicity?.toLowerCase().includes(criteria.ethnicity.toLowerCase())) {
      score += 5;
    }
    return score;
  }

  /**
   * Build searchable text from scholarship fields
   */
  private buildSearchText(scholarship: any): string {
    const textParts: string[] = [];
    
    if (scholarship.eligibility) textParts.push(scholarship.eligibility);
    if (scholarship.description) textParts.push(scholarship.description);
    if (scholarship.title) textParts.push(scholarship.title);
    if (scholarship.organization) textParts.push(scholarship.organization);
    if (scholarship.subjectAreas) textParts.push(scholarship.subjectAreas.join(' '));
    if (scholarship.major) textParts.push(scholarship.major);
    
    return textParts.join(' ');
  }

  /**
   * Build search terms from criteria
   */
  private buildSearchTerms(criteria: SearchCriteria): string[] {
    const terms: string[] = [];
    
    // Add subject areas
    if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
      terms.push(...criteria.subjectAreas);
    }
    
    // Add target type (if not 'Both')
    if (criteria.targetType && criteria.targetType !== 'Both') {
      terms.push(criteria.targetType);
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
   * Rank scholarships based on relevance to search criteria
   * @param scholarships - Array of scholarships
   * @param criteria - Search criteria
   * @returns Ranked array
   */
  private rankScholarships(scholarships: ScholarshipItem[], criteria: SearchCriteria): ScholarshipItem[] {
    return scholarships.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
        const majorMatchA = criteria.subjectAreas.some(major => 
          a.academicLevel?.toLowerCase().includes(major.toLowerCase())
        );
        const majorMatchB = criteria.subjectAreas.some(major => 
          b.academicLevel?.toLowerCase().includes(major.toLowerCase())
        );
        if (majorMatchA) scoreA += 10;
        if (majorMatchB) scoreB += 10;
      }
      if (criteria.gender && a.gender?.toLowerCase().includes(criteria.gender.toLowerCase())) {
        scoreA += 5;
      }
      if (criteria.gender && b.gender?.toLowerCase().includes(criteria.gender.toLowerCase())) {
        scoreB += 5;
      }
      if (criteria.ethnicity && a.ethnicity?.toLowerCase().includes(criteria.ethnicity.toLowerCase())) {
        scoreA += 5;
      }
      if (criteria.ethnicity && b.ethnicity?.toLowerCase().includes(criteria.ethnicity.toLowerCase())) {
        scoreB += 5;
      }
      if (a.source === 'dynamodb') scoreA += 3;
      if (b.source === 'dynamodb') scoreB += 3;
      if (a.source === 'bedrock-ai') scoreA += 2;
      if (b.source === 'bedrock-ai') scoreB += 2;
      return scoreB - scoreA;
    });
  }
}

export default EnhancedAIService; 