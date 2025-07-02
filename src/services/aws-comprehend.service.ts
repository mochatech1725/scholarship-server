import { DetectEntitiesCommand, DetectKeyPhrasesCommand, DetectSentimentCommand, LanguageCode } from "@aws-sdk/client-comprehend";
import { comprehendClient, awsServiceConfig } from '../config/aws.config.js';

export interface EntityAnalysis {
  entities: any[];
  keyPhrases: any[];
  sentiment: any;
}

export class AWSComprehendService {
  private languageCode: LanguageCode;

  constructor() {
    this.languageCode = awsServiceConfig.comprehend.languageCode as LanguageCode;
  }

  /**
   * Analyze scholarship text using AWS Comprehend
   * @param text - Text to analyze
   * @returns Promise with comprehensive analysis results
   */
  async analyzeScholarshipText(text: string): Promise<EntityAnalysis> {
    try {
      // Truncate text if it's too long for Comprehend (max 5000 bytes)
      const truncatedText = this.truncateText(text, 4500);

      const [entities, keyPhrases, sentiment] = await Promise.all([
        this.detectEntities(truncatedText),
        this.detectKeyPhrases(truncatedText),
        this.detectSentiment(truncatedText)
      ]);

      return {
        entities,
        keyPhrases,
        sentiment
      };
    } catch (error) {
      console.error('Error analyzing text with Comprehend:', error);
      throw new Error(`Comprehend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect entities in text
   * @param text - Text to analyze
   * @returns Promise with detected entities
   */
  async detectEntities(text: string): Promise<any[]> {
    try {
      const command = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: this.languageCode,
      });

      const response = await comprehendClient.send(command);
      return response.Entities || [];
    } catch (error) {
      console.error('Error detecting entities:', error);
      return [];
    }
  }

  /**
   * Detect key phrases in text
   * @param text - Text to analyze
   * @returns Promise with detected key phrases
   */
  async detectKeyPhrases(text: string): Promise<any[]> {
    try {
      const command = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: this.languageCode,
      });

      const response = await comprehendClient.send(command);
      return response.KeyPhrases || [];
    } catch (error) {
      console.error('Error detecting key phrases:', error);
      return [];
    }
  }

  /**
   * Detect sentiment in text
   * @param text - Text to analyze
   * @returns Promise with sentiment analysis
   */
  async detectSentiment(text: string): Promise<any> {
    try {
      const command = new DetectSentimentCommand({
        Text: text,
        LanguageCode: this.languageCode,
      });

      const response = await comprehendClient.send(command);
      return {
        sentiment: response.Sentiment,
        sentimentScore: response.SentimentScore
      };
    } catch (error) {
      console.error('Error detecting sentiment:', error);
      return { sentiment: 'NEUTRAL', sentimentScore: null };
    }
  }

  /**
   * Extract relevant scholarship information from entities
   * @param entities - Detected entities
   * @returns Structured scholarship information
   */
  extractScholarshipInfo(entities: any[]): any {
    const scholarshipInfo: any = {
      organizations: [],
      locations: [],
      amounts: [],
      dates: [],
      academicFields: [],
      demographics: []
    };

    entities.forEach(entity => {
      switch (entity.Type) {
        case 'ORGANIZATION':
          scholarshipInfo.organizations.push({
            text: entity.Text,
            score: entity.Score
          });
          break;
        case 'LOCATION':
          scholarshipInfo.locations.push({
            text: entity.Text,
            score: entity.Score
          });
          break;
        case 'QUANTITY':
          if (entity.Text.match(/\$|\d+/) || entity.Text.toLowerCase().includes('dollar')) {
            scholarshipInfo.amounts.push({
              text: entity.Text,
              score: entity.Score
            });
          }
          break;
        case 'DATE':
          scholarshipInfo.dates.push({
            text: entity.Text,
            score: entity.Score
          });
          break;
        case 'OTHER':
          // Check for academic fields, demographics, etc.
          const text = entity.Text.toLowerCase();
          if (text.includes('computer') || text.includes('engineering') || text.includes('science') || 
              text.includes('business') || text.includes('arts') || text.includes('medicine')) {
            scholarshipInfo.academicFields.push({
              text: entity.Text,
              score: entity.Score
            });
          } else if (text.includes('female') || text.includes('male') || text.includes('hispanic') || 
                     text.includes('african') || text.includes('asian') || text.includes('native')) {
            scholarshipInfo.demographics.push({
              text: entity.Text,
              score: entity.Score
            });
          }
          break;
      }
    });

    return scholarshipInfo;
  }

  /**
   * Truncate text to fit Comprehend limits
   * @param text - Original text
   * @param maxBytes - Maximum bytes allowed
   * @returns Truncated text
   */
  private truncateText(text: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    if (bytes.length <= maxBytes) {
      return text;
    }

    // Truncate to fit within byte limit
    let truncated = text;
    while (encoder.encode(truncated).length > maxBytes) {
      truncated = truncated.slice(0, -1);
    }

    return truncated;
  }
}

export default AWSComprehendService; 