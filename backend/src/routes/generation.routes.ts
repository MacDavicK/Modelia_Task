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
  // Wrap multer upload in error handler to catch file filter errors immediately
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        // Store multer error on request object for validateUploadedFile to check
        (req as any).multerError = err;
        // Handle specific multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Validation failed',
            details: [{ field: 'image', message: 'File size exceeds 10MB limit' }],
          });
        }
        if (err.message && (err.message.includes('file type') || err.message.includes('Invalid file type') || err.code === 'INVALID_FILE_TYPE')) {
          return res.status(400).json({
            error: 'Validation failed',
            details: [{ field: 'image', message: err.message || 'Invalid file type. Only JPEG and PNG images are allowed.' }],
          });
        }
        // Pass other multer errors to next error handler
        return next(err);
      }
      next();
    });
  },
  validateUploadedFile, // Validate uploaded file
  validateGeneration(generateSchema, imageFileSchema), // Validate prompt, style, and file
  createGenerationController
);

// GET /api/generations - Get user's generations
router.get('/', authenticate, getUserGenerationsController);

export default router;

