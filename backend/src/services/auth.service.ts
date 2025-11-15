import * as bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../utils/db.js';
import { CustomError } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Ensure JWT_SECRET is a string for TypeScript
const jwtSecret: string = JWT_SECRET;

// User type without password
export type UserWithoutPassword = {
  id: string;
  email: string;
  createdAt: Date;
};

// Auth response type
export type AuthResponse = {
  token: string;
  user: UserWithoutPassword;
};

/**
 * Hash a password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 */
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
};

/**
 * Sign up a new user
 */
export const signup = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    return {
      token,
      user,
    };
  } catch (error) {
    // Handle duplicate email error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new CustomError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    // Re-throw custom errors
    if (error instanceof CustomError) {
      throw error;
    }

    // Log the actual error for debugging
    console.error('Signup error:', error);
    
    // Handle other errors
    throw new CustomError(
      error instanceof Error ? error.message : 'Failed to create user account',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Login an existing user
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });

  // Check if user exists
  if (!user) {
    throw new CustomError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new CustomError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate JWT token
  const token = generateToken(user.id);

  // Return user without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};

/**
 * Verify a JWT token and return the user ID
 */
export const verifyToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') {
        throw new CustomError('Token has expired', HTTP_STATUS.UNAUTHORIZED);
      }

      if (error.name === 'JsonWebTokenError') {
        throw new CustomError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
      }
    }

    throw new CustomError('Token verification failed', HTTP_STATUS.UNAUTHORIZED);
  }
};

