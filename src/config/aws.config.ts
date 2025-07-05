import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  AWS_REGION, 
  AWS_ACCESS_KEY_ID, 
  AWS_SECRET_ACCESS_KEY, 
  AWS_DYNAMODB_TABLE_NAME 
} from '../utils/constants.js';

// AWS Configuration
const awsConfig = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
};

// AWS Service Clients
export const dynamoDBClient = new DynamoDBClient(awsConfig);

// AWS Service Configuration
export const awsServiceConfig = {
  dynamodb: {
    tableName: AWS_DYNAMODB_TABLE_NAME,
    indexName: "ActiveScholarshipsIndex", // Default index for active scholarships
  },
};

export default awsConfig; 