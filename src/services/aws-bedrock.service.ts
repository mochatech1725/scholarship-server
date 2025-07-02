import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient, awsServiceConfig } from '../config/aws.config.js';
import { SearchCriteria } from '../types/searchPreferences.types.js';

export class AWSBedrockService {
  private modelId: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.modelId = awsServiceConfig.bedrock.modelId;
    this.maxTokens = awsServiceConfig.bedrock.maxTokens;
    this.temperature = awsServiceConfig.bedrock.temperature;
  }

  /**
   * Search scholarships using AWS Bedrock AI
   * @param criteria - Search criteria
   * @returns Promise with AI-generated scholarship recommendations
   */
  async searchScholarshipsWithAI(criteria: SearchCriteria): Promise<any> {
    try {
      const userMessage = this.buildSearchPrompt(criteria);

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseAIResponse(responseBody);
    } catch (error) {
      console.error('Error searching scholarships with Bedrock:', error);
      throw new Error(`Bedrock AI search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze scholarship text using AI
   * @param text - Scholarship text to analyze
   * @returns Promise with analysis results
   */
  async analyzeScholarshipText(text: string): Promise<any> {
    try {
      const userMessage = `Analyze the following scholarship information and extract key details:

${text}

Please provide a structured analysis including:
- Scholarship name and organization
- Amount and deadline
- Eligibility requirements
- Target demographics
- Application requirements
- Any special criteria

Format the response as JSON.`;

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: this.maxTokens,
        temperature: 0.1, // Lower temperature for more consistent analysis
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseAIResponse(responseBody);
    } catch (error) {
      console.error('Error analyzing scholarship text with Bedrock:', error);
      throw new Error(`Bedrock AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build search prompt based on criteria
   * @param criteria - Search criteria
   * @returns Formatted prompt string
   */
  private buildSearchPrompt(criteria: SearchCriteria): string {
    const criteriaParts = [];
    
    if (criteria.subjectAreas && criteria.subjectAreas.length > 0) criteriaParts.push(`Major: ${criteria.subjectAreas.join(', ')}`);
    if (criteria.academicGPA) criteriaParts.push(`Minimum GPA: ${criteria.academicGPA}`);
    if (criteria.ethnicity) criteriaParts.push(`Ethnicity: ${criteria.ethnicity}`);
    if (criteria.gender) criteriaParts.push(`Gender: ${criteria.gender}`);
    if (criteria.academicLevel) criteriaParts.push(`Academic Level: ${criteria.academicLevel}`);
    if (criteria.essayRequired !== null) criteriaParts.push(`Essay Required: ${criteria.essayRequired}`);
    if (criteria.recommendationRequired !== null) criteriaParts.push(`Recommendation Required: ${criteria.recommendationRequired}`);
    if (criteria.keywords) criteriaParts.push(`Search Query: ${criteria.keywords}`);
    if (criteria.geographicRestrictions) criteriaParts.push(`Geographic Restrictions: ${criteria.geographicRestrictions}`);

    const criteriaText = criteriaParts.length > 0 ? criteriaParts.join('\n') : 'No specific criteria provided';

    return `Find college scholarships matching the following criteria:

${criteriaText}

Please provide a list of scholarships with their:
- Name and organization
- Amount
- Brief description
- Key eligibility requirements
- Application deadline
- Application requirements

Format the response as a JSON array of scholarship objects.`;
  }

  /**
   * Parse AI response and extract structured data
   * @param responseBody - Raw AI response
   * @returns Parsed scholarship data
   */
  private parseAIResponse(responseBody: any): any {
    try {
      // Extract the content text from the new Claude 3.5 format
      const content = responseBody.content?.[0]?.text || responseBody.completion || '';
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\[[\s\S]*\]/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      // If no JSON found, return the raw content
      return { rawResponse: content };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return { rawResponse: responseBody.content?.[0]?.text || responseBody.completion || 'Unable to parse response' };
    }
  }
}

export default AWSBedrockService; 