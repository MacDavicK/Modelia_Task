import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'backend', 'uploads');

/**
 * Generate a unique filename using UUID and timestamp
 * @param originalName - Original filename from upload
 * @returns Unique filename with extension preserved
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const uuid = randomUUID();
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${uuid}.${extension}`;
};

/**
 * Ensure uploads directory exists, create if it doesn't
 */
const ensureUploadsDir = async (): Promise<void> => {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Save file buffer to disk
 * @param buffer - File buffer from multer
 * @param filename - Unique filename to save as
 * @returns File path relative to uploads directory
 */
export const saveFileToDisk = async (buffer: Buffer, filename: string): Promise<string> => {
  try {
    // Ensure uploads directory exists
    await ensureUploadsDir();

    // Full path to save file
    const filePath = join(UPLOAD_DIR, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return relative path for storage in database
    // This will be used to serve files: /uploads/filename.jpg
    return `/uploads/${filename}`;
  } catch (error) {
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

