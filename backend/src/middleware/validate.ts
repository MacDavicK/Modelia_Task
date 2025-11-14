import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, type ZodError } from 'zod';
import { HTTP_STATUS } from '../utils/constants.js';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError;
        const errors = zodError.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Invalid request data',
      });
    }
  };

// Special validator for multipart/form-data (after multer processes the file)
export const validateGeneration =
  (promptStyleSchema: ZodSchema, fileSchema?: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    try {
      // Validate prompt and style from body
      const bodyData = {
        prompt: req.body.prompt,
        style: req.body.style,
      };
      promptStyleSchema.parse(bodyData);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError;
        errors.push(
          ...zodError.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        );
      }
    }

    // Validate file
    if (!req.file) {
      errors.push({ field: 'image', message: 'Image file is required' });
    } else if (fileSchema) {
      try {
        fileSchema.parse(req.file);
      } catch (error) {
        if (error instanceof Error && 'issues' in error) {
          const zodError = error as ZodError;
          errors.push(
            ...zodError.issues.map((issue) => ({
              field: `image.${issue.path.join('.')}`,
              message: issue.message,
            }))
          );
        }
      }
    }

    if (errors.length > 0) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    next();
  };

