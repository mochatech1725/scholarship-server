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
              const organization = $(element).find('.organization, .org, [class*="organization"]').first().text().trim();
              const requirements = $(element).find('.requirements, .eligibility, [class*="requirements"]').first().text().trim();
              const url = $(element).find('a[href]').first().attr('href') || '';
              const targetType = $(element).find('.target-type, [class*="target"]').first().text().trim();
              const theme = $(element).find('.theme, .category, [class*="theme"]').first().text().trim();
              const gender = $(element).find('.gender, [class*="gender"]').first().text().trim();
              const ethnicity = $(element).find('.ethnicity, [class*="ethnicity"]').first().text().trim();
              const academicLevel = $(element).find('.academic-level, [class*="level"]').first().text().trim();
              const academicYear = $(element).find('.academic-year, [class*="year"]').first().text().trim();
              const academicGPA = $(element).find('.gpa, [class*="gpa"]').first().text().trim();
              
              if (title && description) {
                scrapedData.push(`
                  Scholarship: ${title}
                  Organization: ${organization || 'Not specified'}
                  Description: ${description}
                  Amount: ${amount || 'Not specified'}
                  Deadline: ${deadline || 'Not specified'}
                  Requirements: ${requirements || 'Not specified'}
                  Target Type: ${targetType || 'Not specified'}
                  Theme: ${theme || 'Not specified'}
                  Gender: ${gender || 'Not specified'}
                  Ethnicity: ${ethnicity || 'Not specified'}
                  Academic Level: ${academicLevel || 'Not specified'}
                  Academic Year: ${academicYear || 'Not specified'}
                  Academic GPA: ${academicGPA || 'Not specified'}
                  URL: ${url || website.url}
                  Source: ${website.name}
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
            organization: 'Academic Excellence Foundation',
            description: `Scholarship for students demonstrating excellence in ${keywordString}. This award recognizes outstanding academic achievement and potential for future success.`,
            amount: '$5,000 - $10,000',
            deadline: 'March 15, 2024',
            requirements: 'GPA 3.5+, Full-time student, Demonstrated leadership',
            targetType: 'Undergraduate',
            theme: 'Academic Excellence',
            gender: 'All',
            ethnicity: 'All',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.5,
            url: 'https://scholarships.com/academic-excellence',
            isActive: true,
            source: 'Scholarships.com'
          },
          {
            title: `${keywords[1] || 'Merit'}-Based Financial Aid Program`,
            organization: 'Merit Aid Foundation',
            description: `Comprehensive financial assistance program for ${keywordString} students. This program combines merit and need-based criteria to support deserving students.`,
            amount: '$2,000 - $8,000',
            deadline: 'April 30, 2024',
            requirements: 'Demonstrated need, Academic achievement, Community involvement',
            targetType: 'Undergraduate',
            theme: 'Merit-Based',
            gender: 'All',
            ethnicity: 'All',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.0,
            url: 'https://fastweb.com/merit-aid',
            isActive: true,
            source: 'Fastweb'
          },
          {
            title: `${keywords[2] || 'Leadership'} Achievement Award`,
            organization: 'Leadership Development Institute',
            description: `Prestigious award recognizing exceptional leadership in ${keywordString}. This scholarship celebrates students who have made significant contributions to their communities.`,
            amount: '$1,000 - $5,000',
            deadline: 'May 15, 2024',
            requirements: 'Leadership experience, Community service, Strong academic record',
            targetType: 'Undergraduate',
            theme: 'Leadership',
            gender: 'All',
            ethnicity: 'All',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.2,
            url: 'https://collegeboard.org/leadership-award',
            isActive: true,
            source: 'College Board'
          },
          {
            title: `${keywords[0] || 'STEM'} Innovation Scholarship`,
            organization: 'STEM Innovation Foundation',
            description: `Scholarship supporting innovation and research in ${keywordString} fields. This award is designed for students pursuing careers in science, technology, engineering, or mathematics.`,
            amount: '$3,000 - $7,000',
            deadline: 'June 1, 2024',
            requirements: 'STEM major, Research experience, Innovation project',
            targetType: 'Undergraduate',
            theme: 'STEM',
            gender: 'All',
            ethnicity: 'All',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.3,
            url: 'https://cappex.com/stem-innovation',
            isActive: true,
            source: 'Cappex'
          },
          {
            title: `${keywords[1] || 'Diversity'} and Inclusion Grant`,
            organization: 'Diversity in Education Foundation',
            description: `Grant program promoting diversity and inclusion in ${keywordString} education. This program supports underrepresented students in their academic pursuits.`,
            amount: '$1,500 - $4,000',
            deadline: 'July 1, 2024',
            requirements: 'Underrepresented background, Academic merit, Financial need',
            targetType: 'Undergraduate',
            theme: 'Diversity',
            gender: 'All',
            ethnicity: 'Underrepresented',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.0,
            url: 'https://niche.com/diversity-grant',
            isActive: true,
            source: 'Niche'
          },
          {
            title: `${keywords[2] || 'Community'} Service Scholarship`,
            organization: 'Community Service Foundation',
            description: `Scholarship recognizing outstanding community service in ${keywordString} areas. This award honors students who have made a positive impact through volunteer work.`,
            amount: '$2,500 - $6,000',
            deadline: 'August 15, 2024',
            requirements: 'Volunteer hours, Community impact, Academic standing',
            targetType: 'Undergraduate',
            theme: 'Community Service',
            gender: 'All',
            ethnicity: 'All',
            academicLevel: 'Undergraduate',
            academicYear: 'All',
            academicGPA: 3.0,
            url: 'https://scholarships.com/community-service',
            isActive: true,
            source: 'Scholarships.com'
          }
        ];

        // Convert to text format for AI processing
        mockScholarships.forEach(scholarship => {
          scrapedData.push(`
            Scholarship: ${scholarship.title}
            Organization: ${scholarship.organization}
            Description: ${scholarship.description}
            Amount: ${scholarship.amount}
            Deadline: ${scholarship.deadline}
            Requirements: ${scholarship.requirements}
            Target Type: ${scholarship.targetType}
            Theme: ${scholarship.theme}
            Gender: ${scholarship.gender}
            Ethnicity: ${scholarship.ethnicity}
            Academic Level: ${scholarship.academicLevel}
            Academic Year: ${scholarship.academicYear}
            Academic GPA: ${scholarship.academicGPA}
            URL: ${scholarship.url}
            Is Active: ${scholarship.isActive}
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
  async findScholarships(searchParams: ScholarshipSearchParams): Promise<SearchResponse> {
    const { 
      keywords, 
      maxResults = parseInt(process.env.MAX_RESULTS || '10'), 
      includeDeadlines = true, 
      minAmount, 
      maxAmount,
      useRealScraping = false 
    } = searchParams;

    try {
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
          aiModel: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
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

