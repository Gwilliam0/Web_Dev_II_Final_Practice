import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

describe('Client Endpoints', () => {
    let token = '';
    let userId = '';
    let companyId = new mongoose.Types.ObjectId();

    const testUser = {
        name: 'Client',
        lastName: 'Tester',
        email: 'client@tester.com',
        password: 'Password123!',
        company: companyId,
        nif: '12345678X'
    };

    const testClient = {
        name: 'Test Client Corp',
        cif: 'A12345678',
        email: 'contact@testclient.com',
        phone: '123456789',
        address: {
            street: 'Main St',
            number: '10',
            postal: '28001',
            city: 'Madrid',
            province: 'Madrid'
        }
    };

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send(testUser);
        
        token = res.body.accessToken;
        userId = res.body.user._id;
    });

    describe('POST /api/client', () => {
        it('should create a new client successfully', async () => {
            const res = await request(app)
                .post('/api/client')
                .set('Authorization', `Bearer ${token}`)
                .send(testClient)
                .expect(201);

            expect(res.body.name).toBe(testClient.name);
            expect(res.body.cif).toBe(testClient.cif);
            expect(res.body.user).toBe(userId.toString());
        });

        it('should reject client creation with missing data', async () => {
            await request(app)
                .post('/api/client')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Incomplete' })
                .expect(400);
        });

        it('should reject duplicate CIF for the same user', async () => {
            await request(app)
                .post('/api/client')
                .set('Authorization', `Bearer ${token}`)
                .send(testClient)
                .expect(400);
        });
    });

    describe('GET /api/client', () => {
        it('should list clients with pagination', async () => {
            const res = await request(app)
                .get('/api/client')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(res.body).toHaveProperty('totalItems');
            expect(res.body).toHaveProperty('clients');
            expect(Array.isArray(res.body.clients)).toBe(true);
        });

        it('should filter clients by name', async () => {
            const res = await request(app)
                .get('/api/client')
                .set('Authorization', `Bearer ${token}`)
                .query({ name: 'Test' })
                .expect(200);

            res.body.clients.forEach(client => {
                expect(client.name).toMatch(/Test/i);
            });
        });
    });

    describe('PUT /api/client/:id', () => {
        it('should update client details', async () => {
            const client = await Client.findOne({ user: userId });
            const newName = 'Updated Client Name';

            const res = await request(app)
                .put(`/api/client/${client._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: newName })
                .expect(200);

            expect(res.body.name).toBe(newName);
        });
    });

    describe('DELETE /api/client/:id', () => {
        it('should soft delete a client', async () => {
            const client = await Client.findOne({ user: userId, deleted: false });

            await request(app)
                .delete(`/api/client/${client._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' })
                .expect(200);

            const updatedClient = await Client.findById(client._id);
            expect(updatedClient.deleted).toBe(true);
        });

        it('should restore a soft-deleted client', async () => {
            const client = await Client.findOne({ user: userId, deleted: true });

            await request(app)
                .patch(`/api/client/${client._id}/restore`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const updatedClient = await Client.findById(client._id);
            expect(updatedClient.deleted).toBe(false);
        });

        it('should hard delete a client', async () => {
            const client = await Client.findOne({ user: userId });

            await request(app)
                .delete(`/api/client/${client._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'false' })
                .expect(200);

            const deletedClient = await Client.findById(client._id);
            expect(deletedClient).toBeNull();
        });
    });
});