import { z } from 'zod';

export const STYLE_OPTIONS = ['Realistic', 'Artistic', 'Minimalist', 'Vintage'] as const;

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters long')
    .max(500, 'Prompt must not exceed 500 characters')
    .trim(),
  style: z.enum(STYLE_OPTIONS, {
    errorMap: () => ({
      message: `Style must be one of: ${STYLE_OPTIONS.join(', ')}`,
    }),
  }),
});

export type GenerateInput = z.infer<typeof generateSchema>;

// File validation schema (for multer file uploads)
export const imageFileSchema = z.object({
  fieldname: z.literal('image'),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/jpg', 'image/png'].includes(type),
      'Image must be JPEG or PNG format'
    ),
  size: z
    .number()
    .max(10 * 1024 * 1024, 'Image size must not exceed 10MB'), // 10MB max
  destination: z.string().optional(),
  filename: z.string().optional(), // Optional because memory storage doesn't always set this
  path: z.string().optional(),
  buffer: z.instanceof(Buffer).optional(),
});

export type ImageFile = z.infer<typeof imageFileSchema>;

