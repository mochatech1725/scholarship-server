import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import applicationRoutes from './routes/application.routes.js';
import userRoutes from './routes/user.routes.js';
import recommenderRoutes from './routes/recommender.routes.js';
import authRoutes from './routes/auth.routes.js';
import scholarshipSearchRoutes from './routes/scholarship.search.routes.js';
import authenticateUser from './middleware/auth.middleware.js';
import { initKnex } from './config/knex.config.js';
import { initScholarshipSearchController } from './controllers/scholarship.search.controller.js';
import auth0Config from './config/auth0.config.js';
import { PORT } from './utils/constants.js';

console.log('Starting application...');

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
app.use('/api/applications', authenticateUser, applicationRoutes);
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/recommenders', authenticateUser, recommenderRoutes);
app.use('/api/scholarships', authenticateUser, scholarshipSearchRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: auth0Config.env 
  });
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Scholarship Server API with Auth0 Integration' });
});

// 404 handler - ensure JSON response
app.use((req: Request, res: Response) => {
  res.json({ 
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
    // Initialize Knex with AWS Secrets Manager
    const secretArn = process.env.AWS_SECRET_ARN || '';
    await initKnex(secretArn);
    
    // Initialize scholarship search controller
    await initScholarshipSearchController(secretArn);
    
    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${auth0Config.env}`);
      console.log(`Auth0 Integration: ${auth0Config.audience ? 'Enabled' : 'Disabled'}`);
      console.log(`CORS Origins: ${corsOptions.origin.join(', ')}`);
      console.log('✅ MySQL connection established via Knex');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 