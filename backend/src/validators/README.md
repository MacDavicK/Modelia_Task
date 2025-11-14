# Validation Schemas

This directory contains Zod validation schemas for request validation.

## Usage Examples

### Signup Route

```typescript
import { validate } from '../middleware/validate.js';
import { signupSchema } from './validators/auth.validators.js';

router.post('/signup', validate(signupSchema), signupController);
```

### Login Route

```typescript
import { validate } from '../middleware/validate.js';
import { loginSchema } from './validators/auth.validators.js';

router.post('/login', validate(loginSchema), loginController);
```

### Generation Route (with file upload)

```typescript
import multer from 'multer';
import { validateGeneration } from '../middleware/validate.js';
import { generateSchema, imageFileSchema } from './validators/generation.validators.js';

const upload = multer({ dest: 'uploads/' });

router.post(
  '/generations',
  upload.single('image'),
  validateGeneration(generateSchema, imageFileSchema),
  generationController
);
```

## Error Response Format

All validation errors return a 400 status with this format:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

