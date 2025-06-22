import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import {
  ScholarshipWebsite,
  ScholarshipSearchRequest as ScholarshipSearchParams,
  ScholarshipResult,
  SearchResponse,
  SourcesResponse
} from '../types/scholarship.types.js';
import { aiPrompts } from '../data/ai.prompts.js';
import { scholarshipWebsitesData } from '../data/scholarship.websites.js';

/**
 * AI Scholarship Search Class
 * Handles all AI-related operations for scholarship search
 */
class AIScholarshipSearch {
  private openai: OpenAI;
  private scholarshipWebsites: ScholarshipWebsite[];
  private prompts: any;

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Load AI prompts
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
   * Scrape scholarship data from websites
   * @param {string[]} keywords - Search keywords
   * @param {boolean} useRealScraping - Whether to use real web scraping
   * @returns {Promise<string[]>} Scraped scholarship data
   */
  async scrapeScholarshipData(keywords: string[], useRealScraping: boolean = false): Promise<string[]> {
    const scrapedData: string[] = [];
    
    try {
      if (useRealScraping) {
        // Real web scraping implementation
        for (const website of this.scholarshipWebsites) {
          try {
            console.log(`Scraping ${website.name}...`);
            
            const response = await axios.get(website.searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              timeout: 10000
            });

            const $ = cheerio.load(response.data);
            
            // Extract scholarship information
            $('.scholarship, .scholarship-item, [class*="scholarship"]').each((index, element) => {
              const title = $(element).find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
              const description = $(element).find('.description, .desc, [class*="description"]').first().text().trim();
              const amount = $(element).find('.amount, [class*="amount"]').first().text().trim();
              const deadline = $(element).find('.deadline, [class*="deadline"]').first().text().trim();
              
              if (title && description) {
                scrapedData.push(`
                  Scholarship: ${title}
                  Description: ${description}
                  Amount: ${amount || 'Not specified'}
                  Deadline: ${deadline || 'Not specified'}
                  Source: ${website.name}
                  URL: ${website.url}
                `);
              }
            });

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            console.error(`Error scraping ${website.name}:`, error instanceof Error ? error.message : String(error));
            continue;
          }
        }
      }

      // If no real data was scraped or real scraping is disabled, use mock data
      if (scrapedData.length === 0) {
        const keywordString = keywords.join(' ');
        
        // Generate comprehensive mock scholarship data based on keywords
        const mockScholarships = [
          {
            title: `${keywords[0] || 'Academic'} Excellence Scholarship`,
            description: `Scholarship for students demonstrating excellence in ${keywordString}. This award recognizes outstanding academic achievement and potential for future success.`,
            amount: '$5,000 - $10,000',
            deadline: 'March 15, 2024',
            eligibility: 'GPA 3.5+, Full-time student, Demonstrated leadership',
            source: 'Scholarships.com'
          },
          {
            title: `${keywords[1] || 'Merit'}-Based Financial Aid Program`,
            description: `Comprehensive financial assistance program for ${keywordString} students. This program combines merit and need-based criteria to support deserving students.`,
            amount: '$2,000 - $8,000',
            deadline: 'April 30, 2024',
            eligibility: 'Demonstrated need, Academic achievement, Community involvement',
            source: 'Fastweb'
          },
          {
            title: `${keywords[2] || 'Leadership'} Achievement Award`,
            description: `Prestigious award recognizing exceptional leadership in ${keywordString}. This scholarship celebrates students who have made significant contributions to their communities.`,
            amount: '$1,000 - $5,000',
            deadline: 'May 15, 2024',
            eligibility: 'Leadership experience, Community service, Strong academic record',
            source: 'College Board'
          },
          {
            title: `${keywords[0] || 'STEM'} Innovation Scholarship`,
            description: `Scholarship supporting innovation and research in ${keywordString} fields. This award is designed for students pursuing careers in science, technology, engineering, or mathematics.`,
            amount: '$3,000 - $7,000',
            deadline: 'June 1, 2024',
            eligibility: 'STEM major, Research experience, Innovation project',
            source: 'Cappex'
          },
          {
            title: `${keywords[1] || 'Diversity'} and Inclusion Grant`,
            description: `Grant program promoting diversity and inclusion in ${keywordString} education. This program supports underrepresented students in their academic pursuits.`,
            amount: '$1,500 - $4,000',
            deadline: 'July 1, 2024',
            eligibility: 'Underrepresented background, Academic merit, Financial need',
            source: 'Niche'
          },
          {
            title: `${keywords[2] || 'Community'} Service Scholarship`,
            description: `Scholarship recognizing outstanding community service in ${keywordString} areas. This award honors students who have made a positive impact through volunteer work.`,
            amount: '$2,500 - $6,000',
            deadline: 'August 15, 2024',
            eligibility: 'Volunteer hours, Community impact, Academic standing',
            source: 'Scholarships.com'
          }
        ];

        // Convert to text format for AI processing
        mockScholarships.forEach(scholarship => {
          scrapedData.push(`
            Scholarship: ${scholarship.title}
            Description: ${scholarship.description}
            Amount: ${scholarship.amount}
            Deadline: ${scholarship.deadline}
            Eligibility: ${scholarship.eligibility}
            Source: ${scholarship.source}
          `);
        });
      }

    } catch (error) {
      console.error('Error scraping scholarship data:', error);
    }

    return scrapedData;
  }

  /**
   * Analyze and rank scholarships using AI
   * @param {string[]} keywords - Search keywords
   * @param {string[]} scrapedData - Scraped scholarship data
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<ScholarshipResult[]>} Ranked scholarship results
   */
  async analyzeScholarshipsWithAI(keywords: string[], scrapedData: string[], maxResults: number = 10): Promise<ScholarshipResult[]> {
    try {
      // Format the prompt with template variables
      const userPrompt = this.formatPrompt(this.prompts.scholarshipAnalysis.user, {
        keywords: keywords.join(', '),
        scrapedData: scrapedData.join('\n\n'),
        maxResults: maxResults
      });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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

      // Parse the JSON response
      const scholarships = JSON.parse(response);
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
  async searchScholarships(searchParams: ScholarshipSearchParams): Promise<SearchResponse> {
    const { 
      keywords, 
      maxResults = 10, 
      includeDeadlines = true, 
      minAmount, 
      maxAmount,
      useRealScraping = false 
    } = searchParams;

    try {
      // Validate input
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        throw new Error('Keywords array is required and must not be empty');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Step 1: Scrape scholarship data
      console.log('Scraping scholarship data...');
      const scrapedData = await this.scrapeScholarshipData(keywords, useRealScraping);

      if (scrapedData.length === 0) {
        throw new Error('No scholarship data found');
      }

      // Step 2: Use AI to analyze and rank scholarships
      console.log('Analyzing scholarships with AI...');
      const analyzedScholarships = await this.analyzeScholarshipsWithAI(keywords, scrapedData, maxResults);

      // Step 3: Apply additional filters
      let filteredScholarships = analyzedScholarships;

      if (minAmount || maxAmount) {
        filteredScholarships = filteredScholarships.filter((scholarship: ScholarshipResult) => {
          if (!scholarship.amount) return true;
          
          // Extract numeric amount from string
          const amountMatch = scholarship.amount.match(/\$?([0-9,]+)/);
          if (!amountMatch) return true;
          
          const amount = parseInt(amountMatch[1].replace(/,/g, ''));
          
          if (minAmount && amount < minAmount) return false;
          if (maxAmount && amount > maxAmount) return false;
          
          return true;
        });
      }

      // Step 4: Remove deadline info if not requested
      if (!includeDeadlines) {
        filteredScholarships = filteredScholarships.map((scholarship: ScholarshipResult) => {
          const { deadline, ...rest } = scholarship;
          return rest;
        });
      }

      // Step 5: Return results
      return {
        success: true,
        data: {
          scholarships: filteredScholarships,
          totalFound: filteredScholarships.length,
          keywords: keywords,
          searchTimestamp: new Date().toISOString()
        },
        metadata: {
          sourcesUsed: this.scholarshipWebsites.map((site: ScholarshipWebsite) => site.name),
          aiModel: 'gpt-3.5-turbo',
          processingTime: new Date().toISOString(),
          realScrapingUsed: useRealScraping
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
          url: site.url,
          description: site.description
        })),
        totalSources: this.scholarshipWebsites.length
      }
    };
  }
}

// Export the class
export default AIScholarshipSearch;

