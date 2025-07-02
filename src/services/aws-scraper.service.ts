import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { type Browser } from 'puppeteer';
import { ScholarshipResult, SearchCriteria } from '../types/searchPreferences.types.js';

// Common utilities
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive'
};

// Using ScholarshipResult interface from types instead of custom ScrapedScholarship

export interface ScrapingOptions {
  useSearchCriteria?: boolean;
  maxResults?: number;
  timeout?: number;
  retryAttempts?: number;
}

export class AWSScraperService {
  private browser: Browser | null = null;
  private defaultOptions: ScrapingOptions = {
    useSearchCriteria: true,
    maxResults: 20,
    timeout: 15000,
    retryAttempts: 2
  };

  constructor() {
    // Initialize browser if needed
  }

  /**
   * Initialize browser for scraping
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Build search URL with criteria
   */
  private buildSearchUrl(baseUrl: string, criteria: SearchCriteria): string {
    const params = new URLSearchParams();
    
    if (criteria.keywords) {
      params.append('q', criteria.keywords);
    }
    if (criteria.educationLevel) {
      params.append('level', criteria.educationLevel.toLowerCase());
    }
    if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
      params.append('major', criteria.subjectAreas.join(','));
    }
    if (criteria.gender) {
      params.append('gender', criteria.gender.toLowerCase());
    }
    if (criteria.ethnicity) {
      params.append('ethnicity', criteria.ethnicity.toLowerCase());
    }
    if (criteria.state) {
      params.append('state', criteria.state);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Retry wrapper for scraping functions
   */
  private async withRetry<T>(
    fn: () => Promise<T>, 
    retryAttempts: number = 2
  ): Promise<T> {
    for (let i = 0; i <= retryAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retryAttempts) throw error;
        console.log(`Retry attempt ${i + 1} for scraping function`);
        await delay(1000 * (i + 1)); // Exponential backoff
      }
    }
    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Scrape CareerOneStop scholarships with search criteria
   * Government-sponsored scholarship database - more reliable than commercial sites
   */
  async scrapeCareerOneStop(criteria?: SearchCriteria, options?: ScrapingOptions): Promise<ScholarshipResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    return this.withRetry(async () => {
      try {
        // CareerOneStop uses a different URL structure for search
        let searchUrl = 'https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx';
        
        // Build search parameters for CareerOneStop
        if (criteria) {
          const params = new URLSearchParams();
          
          if (criteria.keywords) {
            params.append('keyword', criteria.keywords);
          }
          if (criteria.educationLevel) {
            // Map education levels to CareerOneStop's format
            const levelMap: Record<string, string> = {
              'High School': 'high-school',
              'Undergraduate': 'undergraduate',
              'Graduate': 'graduate'
            };
            const mappedLevel = levelMap[criteria.educationLevel] || criteria.educationLevel.toLowerCase();
            params.append('education-level', mappedLevel);
          }
          if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
            params.append('field-of-study', criteria.subjectAreas.join(','));
          }
          if (criteria.state) {
            params.append('state', criteria.state);
          }
          
          const queryString = params.toString();
          if (queryString) {
            searchUrl += `?${queryString}`;
          }
        }
        
        const response = await axios.get(searchUrl, {
          headers,
          timeout: opts.timeout
        });
        
        const $ = cheerio.load(response.data);
        const scholarships: ScholarshipResult[] = [];
        
        // CareerOneStop specific selectors
        $('.scholarship-item, .result-item, .search-result, .scholarship-card, .training-result').each((i, elem) => {
          const $elem = $(elem);
          
          // Try multiple selectors for different elements
          const title = $elem.find('h3, h2, .title, .scholarship-title, .name, .result-title').text().trim();
          const amount = $elem.find('.amount, .award-amount, .value, .scholarship-amount, .award').text().trim();
          const deadline = $elem.find('.deadline, .due-date, .expires, .application-deadline, .deadline-date').text().trim();
          const link = $elem.find('a').attr('href');
          const description = $elem.find('.description, .summary, .details, .scholarship-description, .result-description').text().trim();
          const eligibility = $elem.find('.eligibility, .requirements, .criteria, .qualifications').text().trim();
          
          if (title) {
            scholarships.push({
              title,
              amount: amount || 'Amount varies',
              deadline: deadline || 'No deadline specified',
              url: link ? (link.startsWith('http') ? link : `https://www.careeronestop.org${link}`) : '',
              description: description || 'No description available',
              eligibility: eligibility || 'Eligibility requirements not specified',
              source: 'CareerOneStop',
              relevanceScore: 0
            });
          }
        });
        
        // If no results with standard selectors, try alternative approach
        if (scholarships.length === 0) {
          // Look for scholarship data in JSON-LD or structured data
          $('script[type="application/ld+json"]').each((i, elem) => {
            try {
              const jsonData = JSON.parse($(elem).html() || '{}');
              if (jsonData['@type'] === 'Scholarship' || jsonData.name) {
                scholarships.push({
                  title: jsonData.name || jsonData.title || 'CareerOneStop Scholarship',
                  description: jsonData.description || 'No description available',
                  amount: jsonData.amount || jsonData.value || 'Amount varies',
                  deadline: jsonData.deadline || jsonData.applicationDeadline || 'No deadline specified',
                  url: jsonData.url || jsonData.link || '',
                  eligibility: jsonData.eligibility || 'Eligibility requirements not specified',
                  source: 'CareerOneStop',
                  relevanceScore: 0
                });
              }
            } catch (e) {
              // Ignore JSON parsing errors
            }
          });
        }
        
        // If still no results, try scraping from table format
        if (scholarships.length === 0) {
          $('table tr').each((i, elem) => {
            const $row = $(elem);
            const $cells = $row.find('td');
            
            if ($cells.length >= 3) {
              const title = $cells.eq(0).text().trim();
              const amount = $cells.eq(1).text().trim();
              const deadline = $cells.eq(2).text().trim();
              const link = $cells.eq(0).find('a').attr('href');
              
              if (title && title !== 'Scholarship Name') {
                scholarships.push({
                  title,
                  amount: amount || 'Amount varies',
                  deadline: deadline || 'No deadline specified',
                  url: link ? (link.startsWith('http') ? link : `https://www.careeronestop.org${link}`) : '',
                  description: 'Scholarship from CareerOneStop database',
                  source: 'CareerOneStop',
                  relevanceScore: 0
                });
              }
            }
          });
        }
        
        return scholarships.slice(0, opts.maxResults);
        
      } catch (error) {
        console.error('CareerOneStop scraping error:', error);
        return [];
      }
    }, opts.retryAttempts);
  }

  /**
   * Scrape CollegeScholarships.org with search criteria
   * Comprehensive scholarship database with good filtering and structured data
   */
  async scrapeCollegeScholarships(criteria?: SearchCriteria, options?: ScrapingOptions): Promise<ScholarshipResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    return this.withRetry(async () => {
      try {
        // CollegeScholarships.org uses a different URL structure for search
        let searchUrl = 'http://www.collegescholarships.org/';
        
        // Build search parameters for CollegeScholarships.org
        if (criteria) {
          const params = new URLSearchParams();
          
          if (criteria.keywords) {
            params.append('keyword', criteria.keywords);
          }
          if (criteria.educationLevel) {
            // Map education levels to CollegeScholarships.org format
            const levelMap: Record<string, string> = {
              'High School': 'high-school',
              'Undergraduate': 'undergraduate',
              'Graduate': 'graduate'
            };
            const mappedLevel = levelMap[criteria.educationLevel] || criteria.educationLevel.toLowerCase();
            params.append('school-level', mappedLevel);
          }
          if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
            params.append('major', criteria.subjectAreas.join(','));
          }
          if (criteria.gender) {
            params.append('gender', criteria.gender.toLowerCase());
          }
          if (criteria.ethnicity) {
            params.append('ethnicity', criteria.ethnicity.toLowerCase());
          }
          if (criteria.state) {
            params.append('state', criteria.state);
          }
          
          const queryString = params.toString();
          if (queryString) {
            searchUrl += `?${queryString}`;
          }
        }
        
        const response = await axios.get(searchUrl, {
          headers,
          timeout: opts.timeout
        });
        
        const $ = cheerio.load(response.data);
        const scholarships: ScholarshipResult[] = [];
        
        // CollegeScholarships.org specific selectors based on the site structure
        // The site appears to have scholarship cards with award amounts and deadlines
        $('.scholarship-item, .result-item, .scholarship-card, .award-item').each((i, elem) => {
          const $elem = $(elem);
          
          // Extract scholarship information
          const title = $elem.find('h3, h2, h4, .title, .scholarship-title, .award-title').text().trim();
          const amount = $elem.find('.award, .amount, .award-amount, .value, [class*="award"]').text().trim();
          const deadline = $elem.find('.deadline, .due-date, .deadline-date, [class*="deadline"]').text().trim();
          const link = $elem.find('a').attr('href');
          const description = $elem.find('.description, .summary, .details, .scholarship-description').text().trim();
          const eligibility = $elem.find('.eligibility, .requirements, .criteria, .qualifications').text().trim();
          
          if (title) {
            scholarships.push({
              title,
              amount: amount || 'Amount varies',
              deadline: deadline || 'No deadline specified',
              url: link ? (link.startsWith('http') ? link : `http://www.collegescholarships.org${link}`) : '',
              description: description || 'No description available',
              eligibility: eligibility || 'Eligibility requirements not specified',
              source: 'CollegeScholarships.org',
              relevanceScore: 0
            });
          }
        });
        
        // If no results with standard selectors, try alternative approach
        if (scholarships.length === 0) {
          // Look for scholarship data in structured format
          $('div[class*="award"], div[class*="scholarship"]').each((i, elem) => {
            const $elem = $(elem);
            
            // Try to extract from award blocks
            const titleEl = $elem.find('h3, h2, h4, strong, b');
            const amountEl = $elem.find('[class*="award"], [class*="amount"]');
            const deadlineEl = $elem.find('[class*="deadline"], [class*="due"]');
            
            const title = titleEl.text().trim();
            const amount = amountEl.text().trim();
            const deadline = deadlineEl.text().trim();
            const link = $elem.find('a').attr('href');
            
            if (title && title.length > 5) { // Filter out very short titles
              scholarships.push({
                title,
                amount: amount || 'Amount varies',
                deadline: deadline || 'No deadline specified',
                url: link ? (link.startsWith('http') ? link : `http://www.collegescholarships.org${link}`) : '',
                description: 'Scholarship from CollegeScholarships.org database',
                source: 'CollegeScholarships.org',
                relevanceScore: 0
              });
            }
          });
        }
        
        // If still no results, try scraping from list format
        if (scholarships.length === 0) {
          $('li, .list-item').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            
            // Look for patterns that indicate scholarship information
            const amountMatch = text.match(/\$[\d,]+/);
            const deadlineMatch = text.match(/(?:deadline|due|application).*?(?:january|february|march|april|may|june|july|august|september|october|november|december)/i);
            
            if (amountMatch && text.length > 20) {
              const title = text.split('$')[0].trim();
              const amount = amountMatch[0];
              const deadline = deadlineMatch ? deadlineMatch[0] : 'No deadline specified';
              const link = $elem.find('a').attr('href');
              
              if (title && title.length > 5) {
                scholarships.push({
                  title,
                  amount,
                  deadline,
                  url: link ? (link.startsWith('http') ? link : `http://www.collegescholarships.org${link}`) : '',
                  description: 'Scholarship from CollegeScholarships.org database',
                  source: 'CollegeScholarships.org',
                  relevanceScore: 0
                });
              }
            }
          });
        }
        
        return scholarships.slice(0, opts.maxResults);
        
      } catch (error) {
        console.error('CollegeScholarships.org scraping error:', error);
        return [];
      }
    }, opts.retryAttempts);
  }

  /**
   * Convert scraped scholarships to ScholarshipResult format
   */
  private convertToScholarshipResults(scrapedScholarships: ScholarshipResult[]): ScholarshipResult[] {
    return scrapedScholarships.map(scholarship => ({
      title: scholarship.title,
      description: scholarship.description || 'No description available',
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      eligibility: scholarship.eligibility || 'Eligibility requirements not specified',
      url: scholarship.url,
      source: scholarship.source,
      relevanceScore: scholarship.relevanceScore || 0
    }));
  }

  /**
   * Scrape all scholarship sources with search criteria
   */
  async scrapeAllScholarships(criteria?: SearchCriteria, options?: ScrapingOptions): Promise<ScholarshipResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    const scrapers = [
      { name: 'CareerOneStop', fn: this.scrapeCareerOneStop.bind(this) },
      { name: 'CollegeScholarships', fn: this.scrapeCollegeScholarships.bind(this) }
    ];
    
    const results: ScholarshipResult[] = [];
    
    // Run scrapers in parallel with individual error handling
    const scraperPromises = scrapers.map(async (scraper) => {
      try {
        console.log(`Scraping ${scraper.name}...`);
        const scholarships = await scraper.fn(criteria, opts);
        console.log(`${scraper.name}: Found ${scholarships.length} scholarships`);
        return scholarships;
      } catch (error) {
        console.error(`Error scraping ${scraper.name}:`, error);
        return [];
      }
    });
    
    const scraperResults = await Promise.allSettled(scraperPromises);
    
    // Collect results from successful scrapers
    for (const result of scraperResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    }
    
    // Remove duplicates based on title
    const uniqueScholarships = results.filter((scholarship, index, self) => 
      index === self.findIndex(s => s.title === scholarship.title)
    );
    
    return this.convertToScholarshipResults(uniqueScholarships);
  }

  /**
   * Scrape specific source by name with search criteria
   */
  async scrapeSource(sourceName: string, criteria?: SearchCriteria, options?: ScrapingOptions): Promise<ScholarshipResult[]> {
    const scraperMap: Record<string, (criteria?: SearchCriteria, options?: ScrapingOptions) => Promise<ScholarshipResult[]>> = {
      'CareerOneStop': this.scrapeCareerOneStop.bind(this),
      'CollegeScholarships': this.scrapeCollegeScholarships.bind(this)
    };

    const scraper = scraperMap[sourceName];
    if (!scraper) {
      throw new Error(`Unknown source: ${sourceName}`);
    }

    try {
      const scholarships = await scraper(criteria, options);
      return this.convertToScholarshipResults(scholarships);
    } catch (error) {
      console.error(`Error scraping ${sourceName}:`, error);
      throw error;
    }
  }

  /**
   * Get available sources
   */
  getAvailableSources(): string[] {
    return [
      'CareerOneStop',
      'CollegeScholarships'
    ];
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats(): Promise<{
    totalSources: number;
    availableSources: string[];
    lastScrapeTime?: Date;
  }> {
    return {
      totalSources: this.getAvailableSources().length,
      availableSources: this.getAvailableSources()
    };
  }
}
export default AWSScraperService; 