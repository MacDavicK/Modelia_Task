import { type Express, Router } from 'express';
import authRoutes from './auth.routes.js';

export const setupRoutes = (app: Express): void => {
  const router = Router();

  // Health check is already in server.ts
  // Mount API routes
  router.use('/auth', authRoutes);
  // Example: router.use('/generations', generationRoutes);

  // Mount router to app with /api prefix
  app.use('/api', router);
};

