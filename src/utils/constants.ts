import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Server Configuration
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const APP_DEBUG = process.env.APP_DEBUG === 'true';

// MongoDB Configuration
export const MONGODB_URI = process.env.MONGODB_URI || '';

// Auth0 Configuration
export const AUTH0_ISSUER_BASE_URL = process.env.AUTH0_ISSUER_BASE_URL || '';
export const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';

// AI API Keys
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// App Configuration
export const APP_SECRET = process.env.APP_SECRET || '';
export const MAX_SCHOLARSHIP_SEARCH_RESULTS = parseInt(process.env.MAX_SCHOLARSHIP_SEARCH_RESULTS || '25', 10);
export const OPEN_AI_MODEL = process.env.OPEN_AI_MODEL || 'gpt-4.1 mini';

// AWS Configuration
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_BEDROCK_MODEL_ID = process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
export const AWS_DYNAMODB_TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME || 'scholarships';
