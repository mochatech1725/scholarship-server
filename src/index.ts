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
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: auth0Config.debug ? err.message : undefined
  });
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 