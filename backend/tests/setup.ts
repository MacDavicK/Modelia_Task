// IMPORTANT: Set environment variables BEFORE any imports that might use them
// This must be at the very top, before dotenv or any other imports
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-min-32-chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Use test database if available, otherwise use dev database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

export const testPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error'],
});

