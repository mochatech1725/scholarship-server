import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import {
  ScholarshipWebsite,
  ScholarshipSearchRequest as ScholarshipSearchParams,
  ScholarshipResult,
  SearchResponse,
  SourcesResponse,
  SearchFilters
} from '../types/scholarship.types.js';
import { aiPrompts } from '../data/ai.prompts.js';
import { scholarshipWebsitesData } from '../data/scholarship.websites.js';


// TODO: Add pagination
/**
 * AI Scholarship Search Class
 * Handles all AI-related operations for scholarship search
 */
class AIScholarshipSearch {
  private openai: OpenAI;
  private scholarshipWebsites: ScholarshipWebsite[];
  private prompts: any;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.prompts = aiPrompts;
    
    // Scholarship websites for RAG (imported from JSON)
    this.scholarshipWebsites = scholarshipWebsitesData;
  }

  /**
   * Replace template variables in prompt strings
   * @param template - Template string with {variable} placeholders
   * @param variables - Object with variable values
   * @returns Formatted string
   */
  private formatPrompt(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Scrape scholarship data from websites using AI
   * @param {SearchFilters} filters - Search filters
   * @param {boolean} useRealScraping - Whether to use real web scraping
   * @returns {Promise<string[]>} Scraped scholarship data
   */
  async scrapeScholarshipData(filters: SearchFilters, useRealScraping: boolean = false): Promise<string[]> {
    const scrapedData: string[] = [];
    
    try {
      if (useRealScraping) {
        for (const website of this.scholarshipWebsites) {
          try {
            console.log(`Scraping ${website.name}...`);
            
            const response = await axios.get(website.searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
              },
              timeout: 15000,
              maxRedirects: 5
            });

            const htmlContent = response.data;
            
            // Use AI to intelligently parse the HTML content
            const scholarships = await this.parseHTMLWithAI(website.name, website.url, htmlContent);
            
            console.log(`Found ${scholarships.length} scholarships from ${website.name}`);
            
            // Convert the parsed scholarships to the expected string format
            for (const scholarship of scholarships) {
              const scholarshipText = `
                Scholarship: ${scholarship.title || 'Not specified'}
                Organization: ${scholarship.organization || 'Not specified'}
                Description: ${scholarship.description || 'Not specified'}
                Amount: ${scholarship.amount || 'Not specified'}
                Deadline: ${scholarship.deadline || 'Not specified'}
                Requirements: ${scholarship.eligibility || 'Not specified'}
                Target Type: ${scholarship.targetType || 'Not specified'}
                Gender: ${scholarship.gender || 'Not specified'}
                Ethnicity: ${scholarship.ethnicity || 'Not specified'}
                Academic Level: ${scholarship.educationLevel || 'Not specified'}
                Academic Year: ${scholarship.academicYear || 'Not specified'}
                Academic GPA: ${scholarship.gpa || 'Not specified'}
                Essay Required: ${scholarship.essayRequired || 'Not specified'}
                Recommendation Required: ${scholarship.recommendationRequired || 'Not specified'}
                URL: ${scholarship.url || website.url}
                Source: ${website.name}
              `;
              scrapedData.push(scholarshipText);
            }

            // Rate limiting to be respectful to websites
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (error) {
            console.error(`Error scraping ${website.name}:`, error instanceof Error ? error.message : String(error));
            
            // Add a fallback entry to indicate the source was attempted
            scrapedData.push(`
              Scholarship: No scholarships found
              Organization: ${website.name}
              Description: Unable to scrape this website due to technical issues
              Amount: Not specified
              Deadline: Not specified
              Requirements: Not specified
              Target Type: Not specified
              Gender: Not specified
              Ethnicity: Not specified
              Academic Level: Not specified
              Academic Year: Not specified
              Academic GPA: Not specified
              Essay Required: Not specified
              Recommendation Required: Not specified
              URL: ${website.url}
              Source: ${website.name}
            `);
            
            continue;
          }
        }
      }

    } catch (error) {
      console.error('Error scraping scholarship data:', error);
    }

    return scrapedData;
  }

  /**
   * Use AI to intelligently parse HTML content and extract scholarship information
   * @param {string} websiteName - Name of the website being scraped
   * @param {string} websiteUrl - URL of the website
   * @param {string} htmlContent - Raw HTML content
   * @returns {Promise<any[]>} Parsed scholarship data
   */
  private async parseHTMLWithAI(websiteName: string, websiteUrl: string, htmlContent: string): Promise<any[]> {
    try {
      // Clean the HTML content - remove scripts, styles, and excessive whitespace
      const cleanedHTML = this.cleanHTMLContent(htmlContent);
      
      // Truncate HTML content if it's too long for the API
      const maxLength = 12000; // Leave room for prompt and response
      const truncatedHTML = cleanedHTML.length > maxLength 
        ? cleanedHTML.substring(0, maxLength) + '...'
        : cleanedHTML;

      // Format the prompt with template variables
      const userPrompt = this.formatPrompt(this.prompts.htmlParsing.user, {
        websiteName: websiteName,
        websiteUrl: websiteUrl,
        htmlContent: truncatedHTML
      });

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: this.prompts.htmlParsing.system
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent parsing
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI for HTML parsing');
      }

      // Parse the JSON response with error handling
      let scholarships;
      try {
        scholarships = this.extractJSONFromResponse(response);
        
        if (scholarships === null) {
          console.error('Could not extract valid JSON from AI response');
          console.log('Raw AI response:', response);
          return [];
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', response);
        return [];
      }

      // Validate the response structure
      if (!Array.isArray(scholarships)) {
        console.error('AI response is not an array:', scholarships);
        return [];
      }

      // Filter out invalid entries and add source information
      const validScholarships = scholarships
        .filter(scholarship => scholarship && typeof scholarship === 'object')
        .map(scholarship => ({
          ...scholarship,
          source: websiteName,
          url: scholarship.url || websiteUrl
        }));

      return validScholarships;

    } catch (error) {
      console.error('Error parsing HTML with AI:', error);
      return [];
    }
  }

  /**
   * Clean HTML content by removing unnecessary elements and formatting
   * @param {string} htmlContent - Raw HTML content
   * @returns {string} Cleaned HTML content
   */
  private cleanHTMLContent(htmlContent: string): string {
    // Remove script and style tags and their content
    let cleaned = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, '')
      .replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, '');

    // Remove excessive whitespace and normalize
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    return cleaned;
  }

  /**
   * Parse SearchFilters into a human-readable format for AI
   * @param {SearchFilters} filters - Search filters object
   * @returns {string} Formatted search criteria string
   */
  private formatSearchCriteria(filters: SearchFilters): string {
    const criteria: string[] = [];
    
    if (filters.searchQuery) {
      criteria.push(`Search Terms: ${filters.searchQuery}`);
    }
    if (filters.educationLevel) {
      criteria.push(`Education Level: ${filters.educationLevel}`);
    }
    if (filters.educationYear) {
      criteria.push(`Education Year: ${filters.educationYear}`);
    }
    if (filters.targetType) {
      criteria.push(`Target Type: ${filters.targetType}`);
    }
    if (filters.subjectAreas && filters.subjectAreas.length > 0) {
      criteria.push(`Subject Areas: ${filters.subjectAreas.join(', ')}`);
    }
    if (filters.gender) {
      criteria.push(`Gender: ${filters.gender}`);
    }
    if (filters.ethnicity) {
      criteria.push(`Ethnicity: ${filters.ethnicity}`);
    }
    if (filters.academicGPA !== null && filters.academicGPA !== undefined) {
      criteria.push(`Minimum GPA: ${filters.academicGPA}`);
    }
    if (filters.essayRequired !== null && filters.essayRequired !== undefined) {
      criteria.push(`Essay Required: ${filters.essayRequired ? 'Yes' : 'No'}`);
    }
    if (filters.recommendationRequired !== null && filters.recommendationRequired !== undefined) {
      criteria.push(`Recommendation Required: ${filters.recommendationRequired ? 'Yes' : 'No'}`);
    }
    
    return criteria.join('\n');
  }

  /**
   * Analyze and rank scholarships using AI
   * @param {SearchFilters} filters - Search filters
   * @param {string[]} scrapedData - Scraped scholarship data
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<ScholarshipResult[]>} Ranked scholarship results
   */
  async analyzeScholarshipsWithAI(filters: SearchFilters, scrapedData: string[], maxResults: number = 10): Promise<ScholarshipResult[]> {
    try {
      // Format the search criteria for AI
      const searchCriteria = this.formatSearchCriteria(filters);
      
      // Format the prompt with template variables
      const userPrompt = this.formatPrompt(this.prompts.scholarshipAnalysis.user, {
        searchCriteria: searchCriteria,
        scrapedData: scrapedData.join('\n\n'),
        maxResults: maxResults
      });

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: this.prompts.scholarshipAnalysis.system
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response using the helper function
      const scholarships = this.extractJSONFromResponse(response);
      if (scholarships === null) {
        throw new Error('Could not parse AI response as JSON');
      }

      return scholarships;

    } catch (error) {
      console.error('Error analyzing scholarships with AI:', error);
      throw error;
    }
  }

  /**
   * Main search function that combines scraping and AI analysis
   * @param {ScholarshipSearchParams} searchParams - Search parameters
   * @returns {Promise<SearchResponse>} Search results
   */
  async findScholarships(searchParams: ScholarshipSearchParams): Promise<SearchResponse> {
    const { 
      filters, 
      maxResults = parseInt(process.env.MAX_RESULTS || '10'), 
    } = searchParams;

    try {
      if (!filters) {
        throw new Error('Filters object is required');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Step 1: Scrape scholarship data
      console.log('Scraping scholarship data...');
      const scrapedData = await this.scrapeScholarshipData(filters, true);

      if (scrapedData.length === 0) {
        throw new Error('No scholarship data found');
      }

      // Step 2: Use AI to analyze and rank scholarships
      console.log('Analyzing scholarships with AI...');
      const analyzedScholarships = await this.analyzeScholarshipsWithAI(filters, scrapedData, maxResults);

      // Step 3: Apply additional filters
      let filteredScholarships = analyzedScholarships;

      filteredScholarships = filteredScholarships.map((scholarship: ScholarshipResult) => {
        const { deadline, ...rest } = scholarship;
        return rest;
      });

      // Step 5: Return results
      return {
        success: true,
        data: {
          scholarships: filteredScholarships,
          totalFound: filteredScholarships.length,
          searchTimestamp: new Date().toISOString()
        },
        metadata: {
          sourcesUsed: this.scholarshipWebsites.map((site: ScholarshipWebsite) => site.name),
          aiModel: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
          processingTime: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error in searchScholarships:', error);
      throw error;
    }
  }

  /**
   * Get available scholarship sources
   * @returns {SourcesResponse} Scholarship sources information
   */
  getScholarshipSources(): SourcesResponse {
    return {
      success: true,
      data: {
        sources: this.scholarshipWebsites.map((site: ScholarshipWebsite) => ({
          name: site.name,
          url: site.url
        })),
        totalSources: this.scholarshipWebsites.length
      }
    };
  }

  /**
   * Clean and extract JSON from AI response
   * @param {string} response - Raw AI response
   * @returns {any} Parsed JSON or null if failed
   */
  private extractJSONFromResponse(response: string): any {
    if (!response || typeof response !== 'string') {
      return null;
    }

    // First, try direct JSON parsing
    try {
      return JSON.parse(response.trim());
    } catch (error) {
      // Continue to extraction methods
    }

    // Try to extract from markdown code blocks
    try {
      const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    } catch (error) {
      // Continue to next method
    }

    // Try to find JSON array in the response
    try {
      const arrayMatch = response.match(/(\[[\s\S]*?\])/);
      if (arrayMatch && arrayMatch[1]) {
        return JSON.parse(arrayMatch[1].trim());
      }
    } catch (error) {
      // Continue to next method
    }

    // Try to clean the response and parse
    try {
      const cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*/, '') // Remove text before first {
        .replace(/[^}]*$/, '') // Remove text after last }
        .trim();
      
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        return JSON.parse(cleaned);
      }
    } catch (error) {
      // Final attempt failed
    }

    return null;
  }
}

// Export the class
export default AIScholarshipSearch;

