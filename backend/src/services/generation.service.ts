import prisma from '../utils/db.js';
import { saveFileToDisk, generateUniqueFilename } from '../utils/fileUtils.js';
import { CustomError } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

interface CreateGenerationParams {
  userId: string;
  prompt: string;
  style: string;
  imageBuffer: Buffer;
  originalFilename: string;
}

/**
 * Create a new generation with simulated processing delay
 * @param params - Generation parameters
 * @returns Generation object
 */
export const createGeneration = async (params: CreateGenerationParams) => {
  const { userId, prompt, style, imageBuffer, originalFilename } = params;

  // Generate unique filename and save image to disk
  const filename = generateUniqueFilename(originalFilename);
  const imageUrl = await saveFileToDisk(imageBuffer, filename);

  // Simulate processing delay (1-2 seconds)
  const delay = Math.random() * 1000 + 1000; // 1000-2000ms
  await new Promise((resolve) => setTimeout(resolve, delay));

  // 20% chance of model overloaded error
  if (Math.random() < 0.2) {
    throw new CustomError('Model overloaded', HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  // 80% chance: Create generation in database with status 'completed'
  // First verify user exists to provide better error message
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    // User doesn't exist - this is a legitimate error
    throw new CustomError(
      `User with ID ${userId} does not exist`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const generation = await prisma.generation.create({
    data: {
      userId,
      prompt,
      style,
      imageUrl,
      status: 'completed',
    },
    select: {
      id: true,
      userId: true,
      prompt: true,
      style: true,
      imageUrl: true,
      status: true,
      createdAt: true,
    },
  });

  return generation;
};

/**
 * Get user's generations ordered by creation date (newest first)
 * @param userId - User ID
 * @param limit - Maximum number of generations to return (default: 5)
 * @returns Array of generation objects
 */
export const getUserGenerations = async (userId: string, limit: number = 5) => {
  const generations = await prisma.generation.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      imageUrl: true,
      prompt: true,
      style: true,
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return generations;
};

