import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import scholarshipRoutes from './routes/scholarship.routes.js';
import authRoutes from './routes/auth.routes.js';
import authenticateUser from './middleware/auth.middleware.js';
import { connectDB } from './config/databaseConfig.js';
import auth0Config from './config/auth0.config.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = auth0Config.port;

// Middleware
app.disable('x-powered-by'); // remove line that hides server tech
app.use(morgan('dev'));

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:9000', 'http://127.0.0.1:9000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Cache-Control', 
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Debug middleware to log all requests
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const origin = req.headers.origin;
  
//   console.log(`=== REQUEST RECEIVED ===`);
//   console.log(`${req.method} ${req.path}`);
//   console.log('Headers:', {
//     origin: origin,
//     isLocalhost: origin?.includes('localhost') || origin?.includes('127.0.0.1'),
//     authorization: req.headers.authorization ? 'present' : 'missing',
//     'content-type': req.headers['content-type'],
//     'user-agent': req.headers['user-agent']
//   });
//   console.log('URL:', req.url);
//   console.log('Base URL:', req.baseUrl);
//   console.log('Original URL:', req.originalUrl);
//   console.log(`=======================`);
//   next();
// });

// Response logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`=== RESPONSE SENT ===`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.getHeaders());
    console.log(`Data type:`, typeof data);
    console.log(`Data preview:`, typeof data === 'string' ? data.substring(0, 100) : data);
    console.log(`=====================`);
    return originalSend.call(this, data);
  };
  next();
});

// Cache control middleware for API routes
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  });
  next();
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handler to ensure JSON responses
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', err);
  
  // Don't send error details in production
  const errorResponse = {
    message: 'Something went wrong!',
    error: auth0Config.debug ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  res.status(500).json(errorResponse);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', authenticateUser, scholarshipRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: auth0Config.env 
  });
});

// Test Auth0 config route (no authentication required)
app.get('/test-auth0-config', (req: Request, res: Response) => {
  res.json({
    auth0Config: {
      audience: auth0Config.audience,
      issuerBaseURL: auth0Config.issuerBaseUrl,
      hasAudience: !!auth0Config.audience,
      hasIssuer: !!auth0Config.issuerBaseUrl,
      env: auth0Config.env,
      debug: auth0Config.debug
    },
    message: 'Auth0 configuration check'
  });
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Scholarship Server API with Auth0 Integration' });
});

// Simple test route
app.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// 404 handler - ensure JSON response
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Final catch-all to ensure JSON responses
app.use((req: Request, res: Response) => {
  res.status(500).json({
    message: 'Unexpected error - non-JSON response caught',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${auth0Config.env}`);
      console.log(`Auth0 Integration: ${auth0Config.audience ? 'Enabled' : 'Disabled'}`);
      console.log(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 