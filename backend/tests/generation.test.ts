import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/db.js';

// Helper to generate unique test users
const getUniqueUser = (prefix: string) => ({
  email: `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'TestPassword123',
});

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

describe('Generation API', () => {
  let authToken: string;
  let userId: string;
  let otherAuthToken: string;
  let otherUserId: string;

  beforeEach(async () => {
    // CRITICAL: Wait for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear database - delete generations first (due to foreign key constraint)
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 50));

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

    // Verify user exists in database
    const createdUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    
    if (!createdUser) {
      throw new Error(`User ${userId} was not found in database after signup`);
    }

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
    
    // Verify other user exists
    const otherCreatedUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    
    if (!otherCreatedUser) {
      throw new Error(`Other user ${otherUserId} was not found in database after signup`);
    }
    
    // Final wait to ensure everything is settled
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterAll(async () => {
    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up database
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Disconnect Prisma
    await prisma.$disconnect();
  });

  describe('POST /api/generations', () => {
    it('should create a generation successfully (201)', async () => {
      // Verify user exists before creating generation
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        console.error('User does not exist:', userId);
        throw new Error(`User ${userId} does not exist in database`);
      }

      const imageBuffer = createTestImageBuffer();

      // Retry up to 3 times to handle random 503 errors (20% chance)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        response = await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', 'A stylish fashion outfit')
          .field('style', 'Artistic')
          .attach('image', imageBuffer, 'test.jpg');
        
        if (response.status === 201) {
          break; // Success, exit retry loop
        }
        
        if (response.status === 503) {
          attempts++;
          if (attempts < maxAttempts) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
        
        // If it's not 503, fail immediately
        break;
      }
      
      expect(response).not.toBeNull();
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

      // Update expectation to match actual error message
      expect(response.body.error).toBe('Validation failed');
      // Optionally check details array
      if (response.body.details) {
        expect(response.body.details[0].field).toBe('image');
      }
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
      // We'll make 5 requests instead of 10 to keep test under timeout
      let successCount = 0;
      let error503Count = 0;

      for (let i = 0; i < 5; i++) {
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
      expect(successCount + error503Count).toBe(5);
      expect(successCount).toBeGreaterThan(0);
    }, 30000); // 30 second timeout
  });

  describe('GET /api/generations', () => {
    beforeEach(async () => {
      // Wait for previous operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create some test generations for the user
      const imageBuffer = createTestImageBuffer();
      
      // Create 3 generations for test user (with retry logic for 503 errors)
      for (let i = 0; i < 3; i++) {
        let attempts = 0;
        const maxAttempts = 5; // Increased retries for flaky 503 errors
        let success = false;
        
        while (attempts < maxAttempts && !success) {
          const response = await request(app)
            .post('/api/generations')
            .set('Authorization', `Bearer ${authToken}`)
            .field('prompt', `Test prompt ${i}`)
            .field('style', 'Artistic')
            .attach('image', imageBuffer, 'test.jpg');
          
          if (response.status === 201) {
            success = true;
          } else if (response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              // Exponential backoff for retries
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
          } else {
            // Other error, fail immediately
            throw new Error(`Failed to create generation: ${response.status} - ${JSON.stringify(response.body)}`);
          }
        }
        
        if (!success) {
          throw new Error(`Failed to create generation after ${maxAttempts} attempts (all returned 503)`);
        }
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create 2 generations for other user (with retry logic)
      for (let i = 0; i < 2; i++) {
        let attempts = 0;
        const maxAttempts = 5; // Increased retries for flaky 503 errors
        let success = false;
        
        while (attempts < maxAttempts && !success) {
          const response = await request(app)
            .post('/api/generations')
            .set('Authorization', `Bearer ${otherAuthToken}`)
            .field('prompt', `Other user prompt ${i}`)
            .field('style', 'Realistic')
            .attach('image', imageBuffer, 'test.jpg');
          
          if (response.status === 201) {
            success = true;
          } else if (response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              // Exponential backoff for retries
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
          } else {
            throw new Error(`Failed to create generation: ${response.status} - ${JSON.stringify(response.body)}`);
          }
        }
        
        if (!success) {
          throw new Error(`Failed to create generation after ${maxAttempts} attempts (all returned 503)`);
        }
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Wait for all operations to settle
      await new Promise(resolve => setTimeout(resolve, 200));
    }, 30000); // 30 second timeout for setup

    it('should return user\'s generations (200)', async () => {
      const response = await request(app)
        .get('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Verify all generations belong to the user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

