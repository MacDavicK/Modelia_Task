import { type Request, type Response } from 'express';
import { createGeneration, getUserGenerations } from '../services/generation.service.js';
import { CustomError } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a new generation
 * POST /api/generations
 */
export const createGenerationController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract userId from authenticated request
    const userId = req.user?.userId;
    if (!userId) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required',
      });
      return;
    }

    // Extract prompt and style from request body
    const { prompt, style } = req.body;

    // Extract file from multer
    const file = req.file;
    if (!file || !file.buffer) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Image file is required',
      });
      return;
    }

    // Create generation
    const generation = await createGeneration({
      userId,
      prompt,
      style,
      imageBuffer: file.buffer,
      originalFilename: file.originalname,
    });

    res.status(HTTP_STATUS.CREATED).json(generation);
  } catch (err) {
    // Handle custom errors (like model overloaded)
    if (err instanceof CustomError) {
      res.status(err.status).json({
        error: err.message,
      });
      return;
    }

    // Handle unexpected errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create generation',
    });
  }
};

/**
 * Get user's generations
 * GET /api/generations
 */
export const getUserGenerationsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract userId from authenticated request
    const userId = req.user?.userId;
    if (!userId) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required',
      });
      return;
    }

    // Extract limit from query params (default: 5)
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 50) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Limit must be between 1 and 50',
      });
      return;
    }

    // Get user's generations
    const generations = await getUserGenerations(userId, limit);

    res.status(HTTP_STATUS.OK).json(generations);
  } catch {
    // Handle unexpected errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch generations',
    });
  }
};

