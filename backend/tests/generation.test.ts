import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/db.js';

// Helper to generate unique test users
const getUniqueUser = (prefix: string) => ({
  email: `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'TestPassword123',
});

// Test user data - generate unique emails for each test run
const testUser = getUniqueUser('test');
const otherUser = getUniqueUser('other');

// Helper to create a test image buffer with proper JPEG structure
const createTestImageBuffer = (): Buffer => {
  // Create a minimal valid JPEG file structure
  // JPEG Start of Image (SOI) marker: FF D8
  // JPEG Application (APP0) segment: FF E0
  // Length: 00 10 (16 bytes)
  // Identifier: "JFIF\0"
  // Rest of APP0 segment data
  const jpegHeader = Buffer.from([
    0xff, 0xd8, // SOI marker
    0xff, 0xe0, // APP0 marker
    0x00, 0x10, // Length (16 bytes)
    0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x01, // Version
    0x01, // Units (0=no units, 1=dpi)
    0x00, 0x48, // X density
    0x00, 0x48, // Y density
    0x00, 0x00, // Thumbnail width
    0x00, 0x00, // Thumbnail height
  ]);
  // Add some padding to make it a valid test file
  const padding = Buffer.alloc(1000, 0xff);
  return Buffer.concat([jpegHeader, padding]);
};

// Helper to create a test text buffer (for invalid file type tests)
const createTestTextBuffer = (): Buffer => {
  return Buffer.from('This is a text file, not an image');
};

describe('Generation API', () => {
  let authToken: string;
  let userId: string;
  let otherAuthToken: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Clear database - delete generations first (due to foreign key constraint)
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});

    // Generate unique users for this test run
    const currentTestUser = getUniqueUser('test');
    const currentOtherUser = getUniqueUser('other');

    // Create test user and get token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(currentTestUser);
    
    if (signupResponse.status !== 201 || !signupResponse.body.user || !signupResponse.body.token) {
      console.error('Signup failed:', signupResponse.status, signupResponse.body);
      throw new Error(`Failed to create test user: ${JSON.stringify(signupResponse.body)}`);
    }
    
    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    // Create other user
    const otherSignupResponse = await request(app)
      .post('/api/auth/signup')
      .send(currentOtherUser);
    
    if (otherSignupResponse.status !== 201 || !otherSignupResponse.body.user || !otherSignupResponse.body.token) {
      console.error('Other signup failed:', otherSignupResponse.status, otherSignupResponse.body);
      throw new Error(`Failed to create other test user: ${JSON.stringify(otherSignupResponse.body)}`);
    }
    
    otherAuthToken = otherSignupResponse.body.token;
    otherUserId = otherSignupResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/generations', () => {
    it('should create a generation successfully (201)', async () => {
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A stylish fashion outfit')
        .field('style', 'Artistic')
        .attach('image', imageBuffer, 'test.jpg');
      
      // Debug: log response if not 201
      if (response.status !== 201) {
        console.error('Generation creation failed:', {
          status: response.status,
          body: JSON.stringify(response.body, null, 2),
        });
      }
      
      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('prompt', 'A stylish fashion outfit');
      expect(response.body).toHaveProperty('style', 'Artistic');
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should return 401 without authentication token', async () => {
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/generations')
        .field('prompt', 'A stylish fashion outfit')
        .field('style', 'Artistic')
        .attach('image', imageBuffer, 'test.jpg')
        .expect(401);

      expect(response.body.error).toContain('Authentication');
    });

    it('should return 400 for invalid file type', async () => {
      const textBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A stylish fashion outfit')
        .field('style', 'Artistic')
        .attach('image', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body.error).toContain('file type');
    });

    it('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A stylish fashion outfit')
        .field('style', 'Artistic')
        .expect(400);

      expect(response.body.error).toContain('file');
    });

    it('should return 400 for invalid prompt (too short)', async () => {
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Short')
        .field('style', 'Artistic')
        .attach('image', imageBuffer, 'test.jpg')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid style', async () => {
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A stylish fashion outfit')
        .field('style', 'InvalidStyle')
        .attach('image', imageBuffer, 'test.jpg')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle model overloaded error (503) - may need multiple attempts', async () => {
      const imageBuffer = createTestImageBuffer();

      // The service has a 20% chance of throwing "Model overloaded" error
      // We'll make multiple requests and expect at least one to potentially fail
      // For a deterministic test, we can make 10 requests and expect some to succeed
      let successCount = 0;
      let error503Count = 0;

      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Test prompt ${i}`)
          .field('style', 'Artistic')
          .attach('image', imageBuffer, 'test.jpg');

        if (response.status === 201) {
          successCount++;
        } else if (response.status === 503) {
          error503Count++;
          expect(response.body.error).toBe('Model overloaded');
        }
      }

      // We should have at least some successes (80% chance each)
      // and potentially some 503 errors (20% chance each)
      expect(successCount + error503Count).toBe(10);
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/generations', () => {
    beforeEach(async () => {
      // Create some test generations for the user
      const imageBuffer = createTestImageBuffer();
      
      // Create 3 generations for test user
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Test prompt ${i}`)
          .field('style', 'Artistic')
          .attach('image', imageBuffer, 'test.jpg');
      }

      // Create 2 generations for other user
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${otherAuthToken}`)
          .field('prompt', `Other user prompt ${i}`)
          .field('style', 'Realistic')
          .attach('image', imageBuffer, 'test.jpg');
      }
    });

    it('should return user\'s generations (200)', async () => {
      const response = await request(app)
        .get('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Verify all generations belong to the user
      response.body.forEach((generation: any) => {
        expect(generation).toHaveProperty('id');
        expect(generation).toHaveProperty('prompt');
        expect(generation).toHaveProperty('style');
        expect(generation).toHaveProperty('imageUrl');
        expect(generation).toHaveProperty('createdAt');
        expect(generation).toHaveProperty('status');
      });
    });

    it('should not return other users\' generations', async () => {
      const response = await request(app)
        .get('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only return 3 generations (test user's), not 5 (total)
      expect(response.body.length).toBe(3);
      
      // Verify prompts are from test user
      response.body.forEach((generation: any) => {
        expect(generation.prompt).toMatch(/^Test prompt/);
      });
    });

    it('should respect limit query parameter', async () => {
      const response = await request(app)
        .get('/api/generations?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/generations?limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toContain('Limit');
    });

    it('should return 400 for limit out of range', async () => {
      const response = await request(app)
        .get('/api/generations?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toContain('Limit');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/generations')
        .expect(401);

      expect(response.body.error).toContain('Authentication');
    });

    it('should return empty array when user has no generations', async () => {
      // Create a new user with no generations
      const newUserResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'TestPassword123',
        });

      const response = await request(app)
        .get('/api/generations')
        .set('Authorization', `Bearer ${newUserResponse.body.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
});

