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
import { SearchCriteria } from '../types/searchPreferences.types.js';

export interface ScholarshipItem {
  id: string;
  title: string;
  organization: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string;
  targetType: string;
  gender?: string;
  ethnicity?: string;
  educationLevel: string;
  gpa?: number;
  essayRequired: string; // "true" or "false" for DynamoDB
  recommendationRequired: string; // "true" or "false" for DynamoDB
  url: string;
  source: string;
  active: string; // "true" or "false" for DynamoDB
  createdAt: string;
  updatedAt: string;
  // Searchable fields for GSI
  major?: string;
  state?: string;
  minimumGPA?: number;
}

// Interface for input data with boolean values
export interface ScholarshipInput {
  title: string;
  organization: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string;
  targetType: string;
  gender?: string;
  ethnicity?: string;
  educationLevel: string;
  gpa?: number;
  essayRequired: boolean;
  recommendationRequired: boolean;
  url: string;
  source: string;
  active: boolean;
  major?: string;
  state?: string;
  minimumGPA?: number;
}

export class AWSDynamoDBService {
  private tableName: string;
  private indexName: string;

  constructor() {
    this.tableName = awsServiceConfig.dynamodb.tableName;
    this.indexName = awsServiceConfig.dynamodb.indexName;
  }

  /**
   * Store a new scholarship in DynamoDB
   * @param scholarship - Scholarship data to store (with boolean values)
   * @returns Promise with the stored item
   */
  async storeScholarship(scholarship: ScholarshipInput): Promise<ScholarshipItem> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const item: ScholarshipItem = {
        ...scholarship,
        id,
        createdAt: now,
        updatedAt: now,
        // Convert boolean values to strings for DynamoDB
        active: scholarship.active ? "true" : "false",
        essayRequired: scholarship.essayRequired ? "true" : "false",
        recommendationRequired: scholarship.recommendationRequired ? "true" : "false"
      };

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item)
      });

      await dynamoDBClient.send(command);
      return item;
    } catch (error) {
      console.error('Error storing scholarship:', error);
      throw new Error(`Failed to store scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search scholarships based on criteria
   * @param criteria - Search criteria
   * @returns Promise with matching scholarships
   */
  async searchScholarships(criteria: SearchCriteria): Promise<ScholarshipItem[]> {
    try {
      // Choose the best index based on the most specific criteria
      let indexName = 'ActiveScholarshipsIndex';
      let keyConditionExpression = 'active = :active';
      let expressionAttributeValues: Record<string, any> = {
        ":active": { S: "true" }
      };
      let expressionAttributeNames: Record<string, string> = {};

      // Priority order for index selection:
      // 1. Education Level (most specific)
      // 2. Major/Subject Areas
      // 3. State/Location
      // 4. Ethnicity (demographics)
      // 5. Gender
      // 6. GPA
      // 7. Deadline
      // 8. Default to ActiveScholarshipsIndex

      if (criteria.academicLevel) {
        indexName = 'EducationLevelIndex';
        keyConditionExpression = '#educationLevel = :educationLevel';
        expressionAttributeValues[":educationLevel"] = { S: criteria.academicLevel };
        expressionAttributeNames["#educationLevel"] = "educationLevel";
      } else if (criteria.subjectAreas && criteria.subjectAreas.length > 0) {
        indexName = 'MajorIndex';
        keyConditionExpression = '#major = :major';
        expressionAttributeValues[":major"] = { S: criteria.subjectAreas[0] }; // Use first subject area
        expressionAttributeNames["#major"] = "major";
      } else if (criteria.geographicRestrictions) {
        indexName = 'LocationIndex';
        keyConditionExpression = '#state = :state';
        expressionAttributeValues[":state"] = { S: criteria.geographicRestrictions };
        expressionAttributeNames["#state"] = "state";
      } else if (criteria.ethnicity) {
        indexName = 'DemographicsIndex';
        keyConditionExpression = '#ethnicity = :ethnicity';
        expressionAttributeValues[":ethnicity"] = { S: criteria.ethnicity };
        expressionAttributeNames["#ethnicity"] = "ethnicity";
      } else if (criteria.gender) {
        indexName = 'GenderIndex';
        keyConditionExpression = '#gender = :gender';
        expressionAttributeValues[":gender"] = { S: criteria.gender };
        expressionAttributeNames["#gender"] = "gender";
      } else if (criteria.academicGPA) {
        indexName = 'GPAIndex';
        keyConditionExpression = '#minimumGPA = :gpa';
        expressionAttributeValues[":gpa"] = { N: criteria.academicGPA.toString() };
        expressionAttributeNames["#minimumGPA"] = "minimumGPA";
      } 

      // Build filter expressions for non-primary key attributes
      const filterExpressions: string[] = [];

      // Always filter for active scholarships
      filterExpressions.push("active = :active");
      expressionAttributeValues[":active"] = { S: "true" };

      // Handle deadline filters
      if (criteria.deadlineRange) {
        if (criteria.deadlineRange.startDate) {
          filterExpressions.push("#deadline >= :startDate");
          expressionAttributeValues[":startDate"] = { S: criteria.deadlineRange.startDate };
          expressionAttributeNames["#deadline"] = "deadline";
        }
        if (criteria.deadlineRange.endDate) {
          filterExpressions.push("#deadline <= :endDate");
          expressionAttributeValues[":endDate"] = { S: criteria.deadlineRange.endDate };
          expressionAttributeNames["#deadline"] = "deadline";
        }
      }

      // Filter for additional subject areas (if using MajorIndex)
      if (criteria.subjectAreas && criteria.subjectAreas.length > 1 && indexName === 'MajorIndex') {
        const additionalSubjects = criteria.subjectAreas.slice(1).join(', ');
        filterExpressions.push("contains(#major, :additionalSubjects)");
        expressionAttributeValues[":additionalSubjects"] = { S: additionalSubjects };
        expressionAttributeNames["#major"] = "major";
      }

      // Filter for GPA (only when not using GPAIndex)
      if (criteria.academicGPA && indexName !== 'GPAIndex') {
        filterExpressions.push("#minimumGPA <= :gpa");
        expressionAttributeValues[":gpa"] = { N: criteria.academicGPA.toString() };
        expressionAttributeNames["#minimumGPA"] = "minimumGPA";
      }

      // Filter for ethnicity (only when not using DemographicsIndex)
      if (criteria.ethnicity && indexName !== 'DemographicsIndex') {
        filterExpressions.push("contains(#ethnicity, :ethnicity)");
        expressionAttributeValues[":ethnicity"] = { S: criteria.ethnicity };
        expressionAttributeNames["#ethnicity"] = "ethnicity";
      }

      // Filter for gender (only when not using GenderIndex)
      if (criteria.gender && indexName !== 'GenderIndex') {
        filterExpressions.push("contains(#gender, :gender)");
        expressionAttributeValues[":gender"] = { S: criteria.gender };
        expressionAttributeNames["#gender"] = "gender";
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(" AND ") : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
      });

      const response = await dynamoDBClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as ScholarshipItem);
    } catch (error) {
      console.error('Error searching scholarships:', error);
      throw new Error(`Failed to search scholarships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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