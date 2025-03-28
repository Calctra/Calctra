const request = require('supertest');
const app = require('../../calctra/src/index');
const mongoose = require('mongoose');
const User = require('../../calctra/src/models/user.model');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        walletAddress: '0x1234567890abcdef'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      // Verify user is created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
      expect(user.name).toBe(userData.name);
    });

    it('should return 400 for incomplete registration data', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should not allow duplicate email registration', async () => {
      // Create a user first
      await testUtils.createTestUser({
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

      // Try to register with the same email
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await testUtils.createTestUser({
        email: 'login.test@example.com',
        password: 'Password123!'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
    });

    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = await testUtils.createTestUser();
      token = testUtils.generateAuthToken(testUser);
    });

    it('should return current user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id', testUser._id.toString());
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
    });

    it('should not allow access without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
      
      // Check that the cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=none');
    });
  });
}); 