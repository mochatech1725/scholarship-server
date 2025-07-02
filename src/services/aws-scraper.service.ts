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
    if (criteria.academicLevel) {
      params.append('level', criteria.academicLevel.toLowerCase());
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
    if (criteria.geographicRestrictions) {
      params.append('geographicRestrictions', criteria.geographicRestrictions);
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
   */
  async scrapeCareerOneStop(criteria?: SearchCriteria, options?: ScrapingOptions): Promise<ScholarshipResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    return this.withRetry(async () => {
      try {
        let searchUrl = 'https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx';
        
        if (criteria) {
          const params = new URLSearchParams();
          
          if (criteria.keywords) {
            params.append('keyword', criteria.keywords);
          }
          if (criteria.academicLevel) {
            // Map education levels to CareerOneStop's format
            const levelMap: Record<string, string> = {
              'High School': 'high-school',
              'Undergraduate': 'undergraduate', 
              'Graduate': 'graduate'
            };
            const mappedLevel = levelMap[criteria.academicLevel] || criteria.academicLevel.toLowerCase();
            params.append('education-level', mappedLevel);
          }
          if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
            params.append('field-of-study', criteria.subjectAreas.join(','));
          }
          if (criteria.geographicRestrictions) {
            params.append('geographicRestrictions', criteria.geographicRestrictions);
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
        
        // Parse the table structure based on the provided HTML
        $('table tr').each((i, elem) => {
          const $row = $(elem);
          const $cells = $row.find('td');
          
          // Skip header rows and empty rows
          if ($cells.length < 5) return;
          
          // Extract data from each column based on the headers
          const $nameCell = $cells.eq(0); // Award Name column
          const $levelCell = $cells.eq(1); // Level of Study column  
          const $typeCell = $cells.eq(2); // Award Type column
          const $amountCell = $cells.eq(3); // Award Amount column
          const $deadlineCell = $cells.eq(4); // Deadline column
          
          // Check if this is a scholarship (filter by award type)
          const awardType = $typeCell.text().trim();
          if (!awardType.toLowerCase().includes('scholarship')) {
            return; // Skip non-scholarship entries
          }
          
          // Extract scholarship details
          const $link = $nameCell.find('a');
          const title = ($link.text().trim() || $nameCell.find('.detailPageLink').text().trim()).replace(/"/g, '');
          
          if (!title || title === 'Award Name') return; // Skip invalid entries
          
          // Extract organization
          const organizationText = $nameCell.text();
          const orgMatch = organizationText.match(/Organization:\s*(.+?)(?:\n|<br>|Purposes:)/i);
          const organization = orgMatch ? orgMatch[1].trim() : '';
          
          // Extract purposes/description
          const purposesMatch = organizationText.match(/Purposes:\s*(.+?)$/i);
          const purposes = purposesMatch ? purposesMatch[1].trim() : '';
          
          // Get the detail link
          const detailLink = $link.attr('href');
          const fullUrl = detailLink ? 
            (detailLink.startsWith('http') ? detailLink : `https://www.careeronestop.org${detailLink}`) : '';
          
          const levelOfStudy = $levelCell.text().trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ');
           
           if (levelOfStudy.toLowerCase() === 'professional development') {
             return;
           }
          
          // Extract award amount
          const amount = $amountCell.find('.table-Numeric').text().trim() || 
                       $amountCell.text().trim() || 
                       'Amount not specified';
          
          // Extract deadline
          const deadline = $deadlineCell.text().trim() || 'No deadline specified';
          
          // Build description
          let description = '';
          if (purposes) {
            description = purposes;
          } else {
            description = `Scholarship offered by ${organization || 'CareerOneStop database'}`;
          }
          
          if (levelOfStudy?.length > 0) {
            scholarships.push({
              title,
              amount,
              deadline,
              organization,
              url: fullUrl,
              description,
              source: 'CareerOneStop',
              relevanceScore: 0,
              academicLevel: levelOfStudy || undefined,
            });
          }
        });
        
        // Remove duplicates based on title
        const uniqueScholarships = scholarships.filter((scholarship, index, self) =>
          index === self.findIndex(s => s.title === scholarship.title)
        );
        
        return uniqueScholarships.slice(0, opts.maxResults);
        
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
          if (criteria.academicLevel) {
            // Map education levels to CollegeScholarships.org format
            const levelMap: Record<string, string> = {
              'High School': 'high-school',
              'Undergraduate': 'undergraduate',
              'Graduate': 'graduate'
            };
            const mappedLevel = levelMap[criteria.academicLevel] || criteria.academicLevel.toLowerCase();
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
          if (criteria.geographicRestrictions) {
            params.append('geographicRestrictions', criteria.geographicRestrictions);
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
        
        $('.row').each((i, elem) => {
          const $row = $(elem);
          
          // Check if this row contains scholarship data
          const $summary = $row.find('.scholarship-summary');
          const $description = $row.find('.scholarship-description');
          
          if ($summary.length > 0 && $description.length > 0) {
            const amount = $summary.find('.lead strong').text().trim() || 'Amount varies';
            
            const deadline = $summary.find('p').last().find('strong').text().trim() || 'No deadline specified';
            
            const titleElement = $description.find('h4 a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            const description = $description.find('p').not('.visible-xs').first().text().trim();
            const eligibilityItems: string[] = [];
            let academicLevelItems: string[] = [];
            let geographicRestrictionsItems: string[] = [];

            $description.find('ul.fa-ul li').each((j, li) => {
              const $li = $(li);
              const text = $li.find('.trim').text().trim();
              
              const $icon = $li.find('i');
              const iconClasses = $icon.attr('class') || '';
              if (text.length > 0 && !text.includes('No Geographic Restrictions')) {
                if (iconClasses.includes('fa-map-marker')) {
                  geographicRestrictionsItems.push(text);
                } else if (iconClasses.includes('fa-graduation-cap')) {
                  academicLevelItems.push(text);
                } else {
                  eligibilityItems.push(text);
                }
              }
            });
            const eligibility = eligibilityItems.join(' | ');
            const academicLevel = academicLevelItems.join(' | ');
            const geographicRestrictions = geographicRestrictionsItems.join(' | ');
            console.log(`eligibility: ${eligibility}, academicLevel: ${academicLevel}, geographicRestrictions: ${geographicRestrictions}`);
            
            if (title && !title.includes('Find Scholarships')) {
              scholarships.push({
                title,
                amount,
                deadline,
                url: link || '',
                description: description || '',
                eligibility,
                academicLevel: academicLevel || undefined,
                geographicRestrictions: geographicRestrictions || undefined,
                source: 'CollegeScholarships.org',
                relevanceScore: 0
              });
            }
          }
        });
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
      academicLevel: scholarship.academicLevel,
      geographicRestrictions: scholarship.geographicRestrictions,
      organization: scholarship.organization,
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