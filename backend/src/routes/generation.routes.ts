import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, validateUploadedFile } from '../middleware/upload.middleware.js';
import { validateGeneration } from '../middleware/validate.js';
import { generateSchema, imageFileSchema } from '../validators/generation.validators.js';
import {
  createGenerationController,
  getUserGenerationsController,
} from '../controllers/generation.controller.js';

const router = Router();

// POST /api/generations - Create a new generation
router.post(
  '/',
  authenticate, // Require authentication
  upload.single('image'), // Handle file upload
  (req, res, next) => {
    // Handle multer file filter errors
    if ((req as any).fileValidationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: 'image', message: (req as any).fileValidationError }],
      });
    }
    next();
  },
  validateUploadedFile, // Validate uploaded file
  validateGeneration(generateSchema, imageFileSchema), // Validate prompt, style, and file
  createGenerationController
);

// GET /api/generations - Get user's generations
router.get('/', authenticate, getUserGenerationsController);

export default router;

