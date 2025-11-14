import { type Express, Router } from 'express';

// Import route modules here
// Example: import authRoutes from './auth.routes.js';

export const setupRoutes = (app: Express): void => {
  const router = Router();

  // Health check is already in server.ts
  // Add API routes here
  // Example: router.use('/api/auth', authRoutes);
  // Example: router.use('/api/generations', generationRoutes);

  // Mount router to app
  app.use('/api', router);
};

