import { 
  QueryCommand, 
  PutItemCommand, 
  GetItemCommand, 
  UpdateItemCommand, 
  DeleteItemCommand,
  ScanCommand 
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { dynamoDBClient, awsServiceConfig } from '../config/aws.config.js';
import { SearchCriteria, ScholarshipItem } from '../types/searchPreferences.types.js';

// Interface for input data with boolean values (for API input)
export interface ScholarshipInput extends Omit<ScholarshipItem, 'id' | 'createdAt' | 'updatedAt' | 'essayRequired' | 'recommendationRequired' | 'renewable'> {
  essayRequired: boolean;
  recommendationRequired: boolean;
  renewable?: boolean;
  active: boolean;
}

export class AWSDynamoDBService {
  private tableName: string;
  private indexName: string;

  constructor() {
    this.tableName = awsServiceConfig.dynamodb.tableName;
    this.indexName = awsServiceConfig.dynamodb.indexName;
  }

  /**
   * Search scholarships based on criteria using optimized database queries
   * @param criteria - Search criteria
   * @returns Promise with matching scholarships
   */
  async searchScholarships(criteria: SearchCriteria): Promise<ScholarshipItem[]> {
    try {
      const allResults: ScholarshipItem[] = [];
      const seenIds = new Set<string>();

      // Strategy 1: Use specific indexes for exact matches
      const specificQueries = await this.executeSpecificQueries(criteria);
      for (const item of specificQueries) {
        if (!seenIds.has(item.id!)) {
          seenIds.add(item.id!);
          allResults.push(item);
        }
      }

      // Strategy 2: Use text search for comprehensive matching
      if (this.hasTextSearchCriteria(criteria)) {
        const textSearchResults = await this.executeTextSearchQueries(criteria);
        for (const item of textSearchResults) {
          if (!seenIds.has(item.id!)) {
            seenIds.add(item.id!);
            allResults.push(item);
          }
        }
      }

      // Strategy 3: Fallback to active scholarships if no specific criteria
      if (allResults.length === 0 && !this.hasAnyCriteria(criteria)) {
        const fallbackResults = await this.getActiveScholarshipsWithFilters(criteria);
        return fallbackResults;
      }

      return allResults;
    } catch (error) {
      console.error('Error searching scholarships:', error);
      throw new Error(`Failed to search scholarships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute specific queries using indexes for exact matches
   */
  private async executeSpecificQueries(criteria: SearchCriteria): Promise<ScholarshipItem[]> {
    const results: ScholarshipItem[] = [];

    // Query by academic level
    if (criteria.academicLevel) {
      try {
        const academicResults = await this.queryByIndex('academic-level-index', {
          keyCondition: '#academicLevel = :academicLevel',
          expressionAttributeNames: { '#academicLevel': 'academicLevel' },
          expressionAttributeValues: { ':academicLevel': { S: criteria.academicLevel } }
        });
        results.push(...academicResults);
      } catch (error) {
        console.warn('Academic level query failed:', error);
      }
    }

    // Query by ethnicity
    if (criteria.ethnicity) {
      try {
        const ethnicityResults = await this.queryByIndex('ethnicity-index', {
          keyCondition: '#ethnicity = :ethnicity',
          expressionAttributeNames: { '#ethnicity': 'ethnicity' },
          expressionAttributeValues: { ':ethnicity': { S: criteria.ethnicity } }
        });
        results.push(...ethnicityResults);
      } catch (error) {
        console.warn('Ethnicity query failed:', error);
      }
    }

    // Query by gender
    if (criteria.gender) {
      try {
        const genderResults = await this.queryByIndex('gender-index', {
          keyCondition: '#gender = :gender',
          expressionAttributeNames: { '#gender': 'gender' },
          expressionAttributeValues: { ':gender': { S: criteria.gender } }
        });
        results.push(...genderResults);
      } catch (error) {
        console.warn('Gender query failed:', error);
      }
    }

    // Query by organization (if available)
    if (criteria.keywords) {
      try {
        const orgResults = await this.queryByIndex('organization-index', {
          keyCondition: 'contains(#organization, :orgKeyword)',
          expressionAttributeNames: { '#organization': 'organization' },
          expressionAttributeValues: { ':orgKeyword': { S: criteria.keywords } }
        });
        results.push(...orgResults);
      } catch (error) {
        console.warn('Organization query failed:', error);
      }
    }

    return results;
  }

  /**
   * Execute text search queries using contains() functions
   */
  private async executeTextSearchQueries(criteria: SearchCriteria): Promise<ScholarshipItem[]> {
    const results: ScholarshipItem[] = [];
    const searchTerms = this.buildSearchTerms(criteria);

    if (searchTerms.length === 0) return results;

    // Use scan with filter for text search (not ideal but necessary for comprehensive search)
    try {
      const scanResults = await this.scanWithTextFilters(searchTerms);
      results.push(...scanResults);
    } catch (error) {
      console.warn('Text search scan failed:', error);
    }

    return results;
  }

  /**
   * Scan table with text filters using OR logic
   */
  private async scanWithTextFilters(searchTerms: string[]): Promise<ScholarshipItem[]> {
    const results: ScholarshipItem[] = [];
    
    // Build OR filter expression for text search
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {
      ':active': { S: 'true' }
    };
    const expressionAttributeNames: Record<string, string> = {};

    // Add active filter
    filterExpressions.push('active = :active');

    // Add text search filters with OR logic
    searchTerms.forEach((term, index) => {
      const termKey = `:term${index}`;
      const descKey = `#desc${index}`;
      const eligKey = `#elig${index}`;
      const titleKey = `#title${index}`;

      expressionAttributeValues[termKey] = { S: term };
      expressionAttributeNames[descKey] = 'description';
      expressionAttributeNames[eligKey] = 'eligibility';
      expressionAttributeNames[titleKey] = 'title';

      // Search in description, eligibility, and title
      filterExpressions.push(
        `(contains(${descKey}, ${termKey}) OR contains(${eligKey}, ${termKey}) OR contains(${titleKey}, ${termKey}))`
      );
    });

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      Limit: 100 // Limit to prevent excessive scanning
    });

    const response = await dynamoDBClient.send(command);
    return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
  }

  /**
   * Get active scholarships with basic filters
   */
  private async getActiveScholarshipsWithFilters(criteria: SearchCriteria): Promise<ScholarshipItem[]> {
    const filterExpressions: string[] = ['active = :active'];
    const expressionAttributeValues: Record<string, any> = {
      ':active': { S: 'true' }
    };
    const expressionAttributeNames: Record<string, string> = {};

    // Add amount filters
    if (criteria.minAmount) {
      filterExpressions.push('#maxAward >= :minAmount');
      expressionAttributeValues[':minAmount'] = { N: criteria.minAmount.toString() };
      expressionAttributeNames['#maxAward'] = 'maxAward';
    }

    if (criteria.maxAmount) {
      filterExpressions.push('#minAward <= :maxAmount');
      expressionAttributeValues[':maxAmount'] = { N: criteria.maxAmount.toString() };
      expressionAttributeNames['#minAward'] = 'minAward';
    }

    // Add GPA filter
    if (criteria.academicGPA) {
      filterExpressions.push('#academicGPA <= :gpa');
      expressionAttributeValues[':gpa'] = { N: criteria.academicGPA.toString() };
      expressionAttributeNames['#academicGPA'] = 'academicGPA';
    }

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      Limit: 50
    });

    const response = await dynamoDBClient.send(command);
    return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
  }

  /**
   * Generic query method for different indexes
   */
  private async queryByIndex(
    indexName: string, 
    params: {
      keyCondition: string;
      expressionAttributeNames: Record<string, string>;
      expressionAttributeValues: Record<string, any>;
      filterExpression?: string;
    }
  ): Promise<ScholarshipItem[]> {
    // Build expression attribute names and values
    const expressionAttributeNames = { ...params.expressionAttributeNames };
    const expressionAttributeValues = { ...params.expressionAttributeValues };
    
    // Use default filter if none provided
    const filterExpression = params.filterExpression || 'active = :active';
    
    // Only add #active if it's used in the filter expression
    if (filterExpression.includes('active = :active')) {
      expressionAttributeNames['#active'] = 'active';
      expressionAttributeValues[':active'] = { S: 'true' };
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: params.keyCondition,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    });

    const response = await dynamoDBClient.send(command);
    return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
  }

  /**
   * Check if criteria has text search requirements
   */
  private hasTextSearchCriteria(criteria: SearchCriteria): boolean {
    return !!(
      (criteria.subjectAreas && criteria.subjectAreas.length > 0) ||
      (criteria.targetType && criteria.targetType !== 'Both') ||
      criteria.ethnicity ||
      criteria.gender ||
      criteria.keywords
    );
  }

  /**
   * Check if criteria has any search requirements
   */
  private hasAnyCriteria(criteria: SearchCriteria): boolean {
    return !!(
      criteria.academicLevel ||
      criteria.ethnicity ||
      criteria.gender ||
      criteria.keywords ||
      (criteria.subjectAreas && criteria.subjectAreas.length > 0) ||
      (criteria.targetType && criteria.targetType !== 'Both') ||
      criteria.minAmount ||
      criteria.maxAmount ||
      criteria.academicGPA ||
      criteria.deadlineRange
    );
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
   * Get a scholarship by ID
   * @param id - Scholarship ID
   * @returns Promise with the scholarship or null
   */
  async getScholarshipById(id: string): Promise<ScholarshipItem | null> {
    try {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      });

      const response = await dynamoDBClient.send(command);
      return response.Item ? unmarshall(response.Item) as ScholarshipItem : null;
    } catch (error) {
      console.error('Error getting scholarship by ID:', error);
      throw new Error(`Failed to get scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a scholarship
   * @param id - Scholarship ID
   * @param updates - Fields to update
   * @returns Promise with the updated scholarship
   */
  async updateScholarship(id: string, updates: Partial<ScholarshipItem>): Promise<ScholarshipItem> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      // Add updatedAt timestamp
      updateExpressions.push("#updatedAt = :updatedAt");
      expressionAttributeValues[":updatedAt"] = { S: new Date().toISOString() };
      expressionAttributeNames["#updatedAt"] = "updatedAt";

      // Add other updates
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt') {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeValues[`:${key}`] = this.marshallValue(value);
          expressionAttributeNames[`#${key}`] = key;
        }
      });

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ id }),
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: "ALL_NEW"
      });

      const response = await dynamoDBClient.send(command);
      return unmarshall(response.Attributes!) as ScholarshipItem;
    } catch (error) {
      console.error('Error updating scholarship:', error);
      throw new Error(`Failed to update scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a scholarship
   * @param id - Scholarship ID
   * @returns Promise indicating success
   */
  async deleteScholarship(id: string): Promise<boolean> {
    try {
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      });

      await dynamoDBClient.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      throw new Error(`Failed to delete scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active scholarships (for bulk operations)
   * @returns Promise with all active scholarships
   */
  async getAllActiveScholarships(): Promise<ScholarshipItem[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "active = :active",
        ExpressionAttributeValues: {
          ":active": { S: "true" }
        }
      });

      const response = await dynamoDBClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
    } catch (error) {
      console.error('Error getting all active scholarships:', error);
      throw new Error(`Failed to get all scholarships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search scholarships by deadline range using DeadlineIndex
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Promise with scholarships in deadline range
   */
  async searchScholarshipsByDeadline(startDate: string, endDate: string): Promise<ScholarshipItem[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'DeadlineIndex',
        KeyConditionExpression: "active = :active AND #deadline BETWEEN :startDate AND :endDate",
        ExpressionAttributeValues: {
          ":active": { S: "true" },
          ":startDate": { S: startDate },
          ":endDate": { S: endDate }
        },
        ExpressionAttributeNames: {
          "#deadline": "deadline"
        }
      });

      const response = await dynamoDBClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
    } catch (error) {
      console.error('Error searching scholarships by deadline:', error);
      throw new Error(`Failed to search scholarships by deadline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scholarships with deadlines within specified days
   * @param days - Number of days from now
   * @returns Promise with scholarships due within days
   */
  async getScholarshipsDueWithinDays(days: number): Promise<ScholarshipItem[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      return this.searchScholarshipsByDeadline(today, futureDateStr);
    } catch (error) {
      console.error('Error getting scholarships due within days:', error);
      throw new Error(`Failed to get scholarships due within days: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique ID for scholarships
   * @returns Unique ID string
   */
  private generateId(): string {
    return `scholarship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Marshall a value for DynamoDB
   * @param value - Value to marshall
   * @returns Marshallled value
   */
  private marshallValue(value: any): any {
    if (typeof value === 'string') return { S: value };
    if (typeof value === 'number') return { N: value.toString() };
    if (typeof value === 'boolean') return { BOOL: value };
    if (Array.isArray(value)) return { L: value.map(v => this.marshallValue(v)) };
    if (value === null || value === undefined) return { NULL: true };
    return { S: JSON.stringify(value) };
  }
}

export default AWSDynamoDBService; 