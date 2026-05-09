import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

describe('User/Auth Endpoints Full Suite', () => {
    let accessToken = '';
    let refreshToken = '';
    let userId = '';
    let verificationCode = '';

    const testUser = {
        name: 'Test',
        lastName: 'User',
        email: 'fulltest@example.com',
        password: 'TestPassword123',
        nif: '12345678Z'
    };

    describe('POST /api/user/register', () => {
        it('should register and return tokens', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send(testUser)
                .expect(201);

            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
            userId = res.body.user._id;

            const user = await User.findById(userId);
            verificationCode = user.verificationCode;
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

    describe('PUT /api/user/validation', () => {
        it('should validate email with correct code', async () => {
            await request(app)
                .put('/api/user/validation')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code: verificationCode })
                .expect(200);

            const user = await User.findById(userId);
            expect(user.status).toBe('verified');
        });

        it('should reject invalid code', async () => {
            await request(app)
                .put('/api/user/validation')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code: 0o000000 })
                .expect(400);
        });
    });

    describe('POST /api/user/refresh', () => {
        it('should obtain a new access token', async () => {
            const res = await request(app)
                .post('/api/user/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(res.body).toHaveProperty('accessToken');
            accessToken = res.body.accessToken;
        });

        it('should reject invalid refresh token', async () => {
            await request(app)
                .post('/api/user/refresh')
                .send({ refreshToken: 'invalid_token' })
                .expect(401);
        });
    });

    describe('PATCH /api/user/company', () => {
        it('should create a freelance company for the user', async () => {
            const res = await request(app)
                .patch('/api/user/company')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isFreelance: true })
                .expect(200);

            expect(res.body.company).toBeDefined();
            expect(res.body.user.company).toBe(res.body.company._id);
        });
    });

    describe('PUT /api/user/register (Update Profile)', () => {
        it('should update name and lastName', async () => {
            const newDetails = { name: 'UpdatedName', lastName: 'UpdatedLast' };
            const res = await request(app)
                .put('/api/user/register')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(newDetails)
                .expect(200);

            expect(res.body.user.name).toBe(newDetails.name);
        });
    });

    describe('PUT /api/user/password', () => {
        it('should update password with correct current password', async () => {
            await request(app)
                .put('/api/user/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewSecurePassword123'
                })
                .expect(200);
        });

        it('should reject update if current password is wrong', async () => {
            await request(app)
                .put('/api/user/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'wrong_password',
                    newPassword: 'AnotherPassword123'
                })
                .expect(401);
        });
    });

    describe('POST /api/user/invite', () => {
        it('should allow admin to invite a new user', async () => {
            await request(app)
                .post('/api/user/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    email: 'invited@example.com',
                    name: 'Guest',
                    lastName: 'User'
                })
                .expect(201);
        });
    });

    describe('POST /api/user/logout', () => {
        it('should logout successfully', async () => {
            await request(app)
                .post('/api/user/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);

            const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
            expect(tokenRecord.revokedAt).toBeDefined();
        });
    });

    describe('DELETE /api/user/', () => {
        it('should hard delete the account', async () => {
            await request(app)
                .delete('/api/user/')
                .set('Authorization', `Bearer ${accessToken}`)
                .query({ soft: 'false' })
                .expect(200);

            const user = await User.findById(userId);
            expect(user).toBeNull();
        });
    });

    describe('GET /api/user/test-slack', () => {
        it('should trigger the Slack logger on 500 errors', async () => {
            const response = await request(app)
                .get('/api/user/test-slack')
                .expect(500);

             expect(response.body.status).toBe('error');
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