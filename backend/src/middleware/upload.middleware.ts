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

  if (allowedMimeTypes.includes(file.mimetype)) {
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
  if (!req.file) {
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

