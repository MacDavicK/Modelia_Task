import { type Request, type Response, type NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { CustomError } from './errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

// Extend Express Request to include user property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches userId to req.user
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    // Verify token and get userId
    const userId = verifyToken(token);

    // Attach userId to request object
    req.user = {
      userId,
    };

    next();
  } catch (error) {
    // Handle custom errors from verifyToken
    if (error instanceof CustomError) {
      res.status(error.status).json({
        error: error.message,
      });
      return;
    }

    // Handle unexpected errors
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Authentication failed. Invalid or expired token.',
    });
  }
};

