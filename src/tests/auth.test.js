import request from 'supertest';
import app from '../app.js';

describe('Auth Endpoints', () => {
  let token = '';
  let userId = '';
  
  const testUser = {
    name: 'Test',
    lastName: 'User',
    email: `test@example.com`,
    password: 'TestPassword123',
    nif: '12345678Z'
  };

  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user).not.toHaveProperty('password');
      
      token = res.body.accessToken;
      userId = res.body.user._id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect(409);
      
      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/user/login', () => {
    it('should login correctly', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      token = res.body.accessToken;
    });

    it('should reject incorrect password', async () => {
      await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app)
        .post('/api/user/login')
        .send({
          email: 'noexiste@example.com',
          password: 'TestPassword123'
        })
        .expect(404);
    });
  });

  describe('Protected Routes', () => {
    it('should access with valid token', async () => {
      const res = await request(app)
        .get('/api/user/')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.email).toBe(testUser.email);
    });

    it('should reject without token', async () => {
      await request(app)
        .get('/api/user/')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/user/')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);
    });
  });

  // Cleanup - delete the test user
  afterAll(async () => {
    if (userId) {
      await request(app)
        .delete(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });
});