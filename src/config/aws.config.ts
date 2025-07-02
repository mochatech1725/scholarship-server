import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { ComprehendClient } from "@aws-sdk/client-comprehend";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';

dotenv.config();

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// AWS Service Clients
export const bedrockClient = new BedrockRuntimeClient(awsConfig);
export const comprehendClient = new ComprehendClient(awsConfig);
export const dynamoDBClient = new DynamoDBClient(awsConfig);

// AWS Service Configuration
export const awsServiceConfig = {
  bedrock: {
    modelId: process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-v2",
    maxTokens: 2000,
    temperature: 0.5,
  },
  dynamodb: {
    tableName: process.env.AWS_DYNAMODB_TABLE_NAME || "scholarships",
    indexName: "ActiveScholarshipsIndex", // Default index for active scholarships
  },
  comprehend: {
    languageCode: "en",
  },
};

export default awsConfig; 