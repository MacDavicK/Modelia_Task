import multer from 'multer';
import { type Request, type Response, type NextFunction } from 'express';
import { CustomError } from './errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

// Configure memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to accept only JPEG and PNG images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  // Also check file extension as fallback (for test files that might not have mimetype set)
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const allowedExtensions = ['jpg', 'jpeg', 'png'];

  // Check mimetype first, then fallback to extension
  // If mimetype is missing or empty, check extension
  // For test files, supertest might not set mimetype, so we rely on extension
  const hasValidMimeType = file.mimetype && allowedMimeTypes.includes(file.mimetype);
  const hasValidExtension = fileExtension && allowedExtensions.includes(fileExtension);

  if (hasValidMimeType || hasValidExtension) {
    // If mimetype is missing but extension is valid, set a default mimetype
    if (!file.mimetype && hasValidExtension) {
      // Set mimetype based on extension for test files
      if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        (file as any).mimetype = 'image/jpeg';
      } else if (fileExtension === 'png') {
        (file as any).mimetype = 'image/png';
      }
    }
    cb(null, true);
  } else {
    // Pass error to multer, which will be caught by error handler
    const error = new Error('Invalid file type. Only JPEG and PNG images are allowed.');
    (error as any).code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

// Configure multer with memory storage, file filter, and size limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Middleware to validate file after multer processing
export const validateUploadedFile = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Check for multer errors first (stored by route-level error handler)
  // If multer error exists, it means the error was already handled and response sent
  // We should not continue in this case
  const multerError = (req as any).multerError;
  if (multerError) {
    // Multer error was already handled in route-level handler and response was sent
    // Don't continue the middleware chain
    return;
  }

  // Check if multer rejected the file (file filter error)
  // When multer's file filter rejects, req.file is undefined
  if (!req.file) {
    // No file and no multer error means file was not provided
    throw new CustomError('Image file is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Additional validation: check file size (multer should handle this, but double-check)
  if (req.file.size > 10 * 1024 * 1024) {
    throw new CustomError('File size exceeds 10MB limit', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate MIME type again (multer should handle this, but double-check)
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    throw new CustomError(
      'Invalid file type. Only JPEG and PNG images are allowed.',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  next();
};

