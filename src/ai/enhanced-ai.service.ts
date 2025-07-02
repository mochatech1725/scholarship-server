import AWSBedrockService from '../services/aws-bedrock.service.js';
import AWSComprehendService from '../services/aws-comprehend.service.js';
import AWSDynamoDBService, { ScholarshipItem } from '../services/aws-dynamodb.service.js';
import AWSScraperService from '../services/aws-scraper.service.js';
import { ScholarshipResult, SearchCriteria } from '../types/searchPreferences.types.js';

export interface EnhancedSearchRequest {
  searchCriteria: SearchCriteria;
  maxResults?: number;
}

export interface EnhancedSearchResponse {
  scholarships: ScholarshipResult[];
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
  private dynamoDBService: AWSDynamoDBService;
  private scraperService: AWSScraperService;

  constructor() {
    this.bedrockService = new AWSBedrockService();
    this.comprehendService = new AWSComprehendService();
    this.dynamoDBService = new AWSDynamoDBService();
    this.scraperService = new AWSScraperService();
  }

  /**
   * Enhanced scholarship search using multiple AWS services
   * @param request - Enhanced search request
   * @returns Promise with comprehensive search results
   */
  async searchScholarships(request: EnhancedSearchRequest): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();
    const servicesUsed: string[] = [];
    const allScholarships: ScholarshipResult[] = [];

    try {

      try {
        const dynamoResults = await this.dynamoDBService.searchScholarships(request.searchCriteria);
        const convertedResults = this.convertDynamoToResults(dynamoResults);
        allScholarships.push(...convertedResults);
        servicesUsed.push('dynamodb');
      } catch (error) {
        console.error('DynamoDB search failed:', error);
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

      // 3. Scrape scholarship websites for real-time data
      try {
        const scrapedResults = await this.scraperService.scrapeAllScholarships(
          request.searchCriteria,
          {
            maxResults: request.maxResults || 10,
            timeout: 20000,
            retryAttempts: 2
          }
        );
        allScholarships.push(...scrapedResults);
        servicesUsed.push('scraping');
      } catch (error) {
        console.error('Web scraping failed:', error);
      }

      // 4. Analyze results with Comprehend if requested
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

      // 5. Deduplicate and rank results
      const deduplicatedResults = this.deduplicateScholarships(allScholarships);
      const rankedResults = this.rankScholarships(deduplicatedResults, request.searchCriteria);
      const finalResults = rankedResults.slice(0, request.maxResults || 10);

      const searchTime = Date.now() - startTime;

      return {
        scholarships: finalResults,
        sources: {
          dynamodb: allScholarships.filter(s => s.source === 'dynamodb').length,
          ai: allScholarships.filter(s => s.source === 'bedrock-ai').length,
          scraping: allScholarships.filter(s => s.source !== 'dynamodb' && s.source !== 'bedrock-ai').length,
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
   * Convert DynamoDB items to scholarship results
   * @param items - DynamoDB items
   * @returns Array of scholarship results
   */
  private convertDynamoToResults(items: ScholarshipItem[]): ScholarshipResult[] {
    return items.map(item => ({
      title: item.title,
      description: item.description,
      amount: item.amount,
      deadline: item.deadline,
      eligibility: item.eligibility,
      url: item.url,
      source: 'dynamodb',
      gender: item.gender,
      ethnicity: item.ethnicity,
      academicLevel: item.educationLevel,
      academicGPA: item.gpa,
      essayRequired: item.essayRequired === 'true',
      recommendationRequired: item.recommendationRequired === 'true',
      relevanceScore: this.calculateRelevanceScore(item, this.createDefaultSearchFilters())
    }));
  }

  /**
   * Convert AI results to scholarship format
   * @param aiResults - Raw AI results
   * @returns Array of scholarship results
   */
  private convertAIResultsToScholarships(aiResults: any): ScholarshipResult[] {
    const scholarships: ScholarshipResult[] = [];

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
          const scholarship: ScholarshipResult = {
            title: item.title || item.name || 'AI Generated Scholarship',
            description: item.description || item.desc || 'No description available',
            amount: item.amount || item.award_amount || 'Amount not specified',
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
  private deduplicateScholarships(scholarships: ScholarshipResult[]): ScholarshipResult[] {
    const seen = new Set<string>();
    const unique: ScholarshipResult[] = [];
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
      educationLevel: null,
      targetType: null,
      gender: null,
      ethnicity: null,
      academicGPA: null,
      essayRequired: null,
      recommendationRequired: null,
      state: null
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
    if (scholarship.title) score += 1;
    if (scholarship.description) score += 1;
    if (scholarship.amount) score += 1;
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
   * Rank scholarships based on relevance to search criteria
   * @param scholarships - Array of scholarships
   * @param criteria - Search criteria
   * @returns Ranked array
   */
  private rankScholarships(scholarships: ScholarshipResult[], criteria: SearchCriteria): ScholarshipResult[] {
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

  /**
   * Store scholarship in DynamoDB
   * @param scholarship - Scholarship to store
   * @returns Promise with stored scholarship
   */
  async storeScholarship(scholarship: Omit<ScholarshipItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScholarshipItem> {
    // Convert string boolean values to actual booleans for DynamoDB input
    const input: any = {
      ...scholarship,
      active: scholarship.active === 'true',
      essayRequired: scholarship.essayRequired === 'true',
      recommendationRequired: scholarship.recommendationRequired === 'true'
    };
    return await this.dynamoDBService.storeScholarship(input);
  }

  /**
   * Get scholarship by ID from DynamoDB
   * @param id - Scholarship ID
   * @returns Promise with scholarship or null
   */
  async getScholarshipById(id: string): Promise<ScholarshipItem | null> {
    return await this.dynamoDBService.getScholarshipById(id);
  }

  /**
   * Cleanup resources - close browser and other connections
   */
  async cleanup(): Promise<void> {
    try {
      await this.scraperService.closeBrowser();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default EnhancedAIService; 