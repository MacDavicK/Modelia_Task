import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Use test database if available, otherwise use dev database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

// Set JWT_SECRET for tests if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-min-32-chars';
}

export const testPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error'],
});

