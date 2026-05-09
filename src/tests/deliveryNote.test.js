import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import DeliveryNote from '../models/DeliveryNote.js';

describe('Delivery Note Endpoints', () => {
    let token = '';
    let userId = '';
    let companyId = new mongoose.Types.ObjectId();
    let clientId = '';
    let projectId = '';

    const testUser = {
        name: 'Delivery',
        lastName: 'Tester',
        email: 'delivery@tester.com',
        password: 'Password123!',
        company: companyId,
        nif: '12345678D'
    };

    const testClient = {
        name: 'Delivery Client Corp',
        cif: 'B12345678',
        email: 'contact@deliveryclient.com',
        phone: '123456789',
        address: {
            street: 'Main St',
            number: '10',
            postal: '28001',
            city: 'Madrid',
            province: 'Madrid'
        }
    };

    const testProject = {
        name: 'Delivery Project',
        email: 'project@delivery.com',
        notes: 'Notes',
        projectCode: 'DLV001',
        address: { street: 'Main St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
        active: true
    };

    const getTestDeliveryNote = () => ({
        project: projectId,
        client: clientId,
        format: 'material',
        description: 'Test delivery note description',
        workDate: new Date().toISOString(),
        material: 'Concrete',
        quantity: 10,
        unit: 'm3',
        hours: 0,
        workers: [{ hours: 0, name: 'Worker 1' }]
    });

    beforeAll(async () => {
        let res = await request(app).post('/api/user/register').send(testUser);
        token = res.body.accessToken;
        userId = res.body.user._id;

        res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(testClient);
        clientId = res.body._id;

        res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...testProject, clientId });
        projectId = res.body._id;
    });

    describe('POST /api/deliverynote', () => {
        it('should create a new delivery note successfully', async () => {
            const res = await request(app)
                .post('/api/deliverynote')
                .set('Authorization', `Bearer ${token}`)
                .send(getTestDeliveryNote())
                .expect(201);

            expect(res.body.user).toBe(userId.toString());
            expect(res.body.client).toBe(clientId.toString());
            expect(res.body.project).toBe(projectId.toString());
            expect(res.body.description).toBe('Test delivery note description');
        });

        it('should reject creation with project not found in company', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .post('/api/deliverynote')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...getTestDeliveryNote(), project: fakeId })
                .expect(404);
        });
    });

    describe('GET /api/deliverynote', () => {
        it('should list delivery notes with pagination', async () => {
            const res = await request(app)
                .get('/api/deliverynote')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(res.body).toHaveProperty('totalItems');
            expect(res.body).toHaveProperty('notes');
            expect(Array.isArray(res.body.notes)).toBe(true);
        });

        it('should filter delivery notes by project ID', async () => {
            const res = await request(app)
                .get('/api/deliverynote')
                .set('Authorization', `Bearer ${token}`)
                .query({ project: projectId })
                .expect(200);

            res.body.notes.forEach(note => {
                expect(note.project._id || note.project).toBe(projectId.toString());
            });
        });
    });

    describe('GET /api/deliverynote/:id', () => {
        it('should get a delivery note by ID', async () => {
            const note = await DeliveryNote.findOne({ user: userId });

            const res = await request(app)
                .get(`/api/deliverynote/${note._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('description');
            expect(res.body.description).toBe(note.description);
        });
    });

    describe('DELETE /api/deliverynote/:id', () => {
        it('should delete an unsigned delivery note', async () => {
            const note = await DeliveryNote.findOne({ user: userId });

            await request(app)
                .delete(`/api/deliverynote/${note._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const deletedNote = await DeliveryNote.findById(note._id);
            expect(deletedNote).toBeNull();
        });

        it('should return 404 for nonexistent note', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .delete(`/api/deliverynote/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });

        it('should not delete a delivery note if it is signed', async () => {
            const signedNote = await DeliveryNote.create({
                ...getTestDeliveryNote(),
                user: userId,
                company: companyId,
                signed: true
            });

            await request(app)
                .delete(`/api/deliverynote/${signedNote._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });
    });
});