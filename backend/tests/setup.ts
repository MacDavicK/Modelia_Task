// IMPORTANT: Set environment variables BEFORE any imports that might use them
// This must be at the very top, before dotenv or any other imports
import dotenv from 'dotenv';
import { join, resolve } from 'path';

// Load test environment variables first (from .env.test if it exists)
const testEnvPath = join(process.cwd(), '.env.test');
dotenv.config({ path: testEnvPath });

// Set defaults if not already set by .env.test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-min-32-chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Resolve database path relative to backend directory (where tests run from)
// If DATABASE_URL is already set and is a file: URL, ensure it's resolved correctly
if (!process.env.DATABASE_URL) {
  const dbPath = resolve(process.cwd(), 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
} else if (process.env.DATABASE_URL.startsWith('file:./')) {
  // Convert relative path to absolute
  const relativePath = process.env.DATABASE_URL.replace('file:', '');
  const dbPath = resolve(process.cwd(), relativePath);
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from '@prisma/client';

// Use test database if available, otherwise use dev database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

export const testPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error'],
});

