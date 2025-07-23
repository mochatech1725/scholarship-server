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
export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || '';
export const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || '';

// App Configuration
export const APP_SECRET = process.env.APP_SECRET || '';
export const MAX_SCHOLARSHIP_SEARCH_RESULTS = parseInt(process.env.MAX_SCHOLARSHIP_SEARCH_RESULTS || '25', 10);

// AWS Configuration
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

// Knex MySQL Pool Configuration
export const KNEX_MYSQL_POOL_MIN = parseInt(process.env.KNEX_MYSQL_POOL_MIN || '0', 10);
export const KNEX_MYSQL_POOL_MAX = parseInt(process.env.KNEX_MYSQL_POOL_MAX || '10', 10);
export const KNEX_MYSQL_POOL_ACQUIRE_TIMEOUT = parseInt(process.env.KNEX_MYSQL_POOL_ACQUIRE_TIMEOUT || '60000', 10);
export const KNEX_MYSQL_POOL_CREATE_TIMEOUT = parseInt(process.env.KNEX_MYSQL_POOL_CREATE_TIMEOUT || '30000', 10);
export const KNEX_MYSQL_POOL_DESTROY_TIMEOUT = parseInt(process.env.KNEX_MYSQL_POOL_DESTROY_TIMEOUT || '5000', 10);
export const KNEX_MYSQL_POOL_IDLE_TIMEOUT = parseInt(process.env.KNEX_MYSQL_POOL_IDLE_TIMEOUT || '30000', 10);
export const KNEX_MYSQL_POOL_REAP_INTERVAL = parseInt(process.env.KNEX_MYSQL_POOL_REAP_INTERVAL || '1000', 10);
export const KNEX_MYSQL_POOL_CREATE_RETRY_INTERVAL = parseInt(process.env.KNEX_MYSQL_POOL_CREATE_RETRY_INTERVAL || '100', 10);
