import { type Request, type Response } from 'express';
import { signup, login } from '../services/auth.service.js';
import { CustomError } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signupController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await signup(email, password);

    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error) {
    // Handle custom errors (like duplicate email)
    if (error instanceof CustomError) {
      res.status(error.status).json({
        error: error.message,
      });
      return;
    }

    // Handle unexpected errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create user account',
    });
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
export const loginController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    // Handle custom errors (like invalid credentials)
    if (error instanceof CustomError) {
      res.status(error.status).json({
        error: error.message,
      });
      return;
    }

    // Handle unexpected errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to login',
    });
  }
};

