import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { ComprehendClient } from "@aws-sdk/client-comprehend";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  AWS_REGION, 
  AWS_ACCESS_KEY_ID, 
  AWS_SECRET_ACCESS_KEY, 
  AWS_BEDROCK_MODEL_ID, 
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
export const bedrockClient = new BedrockRuntimeClient(awsConfig);
export const comprehendClient = new ComprehendClient(awsConfig);
export const dynamoDBClient = new DynamoDBClient(awsConfig);

// AWS Service Configuration
export const awsServiceConfig = {
  bedrock: {
    modelId: AWS_BEDROCK_MODEL_ID,
    maxTokens: 2000,
    temperature: 0.5,
  },
  dynamodb: {
    tableName: AWS_DYNAMODB_TABLE_NAME,
    indexName: "ActiveScholarshipsIndex", // Default index for active scholarships
  },
  comprehend: {
    languageCode: "en",
  },
};

export default awsConfig; 