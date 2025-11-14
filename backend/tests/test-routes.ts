import { Router } from 'express';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { type Request, type Response } from 'express';

const router = Router();

// Test protected route for authentication testing
router.get('/generations', authenticate, (req: Request, res: Response) => {
  res.json({
    message: 'Protected route accessed',
    userId: req.user?.userId,
  });
});

export default router;

