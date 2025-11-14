import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { join } from 'path';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { setupRoutes } from './routes/index.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(morgan('dev'));

// Serve static files from uploads directory
const uploadsPath = join(process.cwd(), 'backend', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Setup API routes
setupRoutes(app);

// Multer error handler (must be before 404 handler)
app.use((err: any, req: any, res: any, next: any) => {
  // Handle multer errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ field: 'image', message: 'File size exceeds 10MB limit' }],
    });
  }
  if (err && err.message && (err.message.includes('file type') || err.message.includes('Invalid file type'))) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ field: 'image', message: err.message }],
    });
  }
  next(err);
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
export { PORT };

