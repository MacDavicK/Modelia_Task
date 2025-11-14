import request from 'supertest';
import express, { type Express } from 'express';
import app from '../src/app.js';
import prisma from '../src/utils/db.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { setupRoutes } from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Create test app with a protected route for testing
const testApp: Express = express();
testApp.use(express.json());
setupRoutes(testApp);

// Add a test protected route
testApp.get('/api/test-protected', authenticate, (req, res) => {
  res.json({ message: 'Protected route', userId: req.user?.userId });
});

// Add error handler
testApp.use(errorHandler);

// Test user data - use unique emails to avoid conflicts
const getTestUser = () => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'TestPassword123',
});

const testUser = getTestUser();
const invalidUser = {
  email: 'nonexistent@example.com',
  password: 'WrongPassword123',
};

describe('Authentication API', () => {
  // Clean up database before each test
  beforeEach(async () => {
    // Delete all generations first (due to foreign key constraint)
    await prisma.generation.deleteMany({});
    // Then delete all users
    await prisma.user.deleteMany({});
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return 201 with token', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/signup')
        .send(uniqueUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(uniqueUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: uniqueUser.email },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(uniqueUser.email);
    });

    it('should return 409 for duplicate email', async () => {
      const uniqueUser = getTestUser();
      // Create first user
      await request(app).post('/api/auth/signup').send(uniqueUser).expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(uniqueUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: uniqueUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should return 400 for password too short', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: uniqueUser.email,
          password: 'Short1',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for password without uppercase', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: uniqueUser.email,
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for password without number', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: uniqueUser.email,
          password: 'Password',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    let loginUser: { email: string; password: string };

    beforeEach(async () => {
      // Create a user for login tests
      loginUser = getTestUser();
      await request(app).post('/api/auth/signup').send(loginUser).expect(201);
    });

    it('should login successfully and return 200 with token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginUser)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password', async () => {
      const uniqueUser = getTestUser();
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueUser.email,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let protectedUser: { email: string; password: string };

    beforeEach(async () => {
      // Create user and get token
      protectedUser = getTestUser();
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(protectedUser)
        .expect(201);
      authToken = signupResponse.body.token;
    });

    it('should return 401 for protected route without token', async () => {
      const response = await request(testApp)
        .get('/api/test-protected')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authentication');
    });

    it('should return 401 for protected route with invalid token', async () => {
      const response = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for protected route with malformed token', async () => {
      const response = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for protected route with expired/invalid token', async () => {
      // Test with an invalid token format
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';
      
      const response = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should allow access to protected route with valid token', async () => {
      const response = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.userId).toBeTruthy();
    });
  });
});

