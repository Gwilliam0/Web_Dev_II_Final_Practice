import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';

describe('Project Endpoints', () => {
    let token = '';
    let userId = '';
    let companyId = new mongoose.Types.ObjectId();
    let clientId = new mongoose.Types.ObjectId();

    const testUser = {
        name: 'Project',
        lastName: 'Tester',
        email: 'project@tester.com',
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

    const testProject = {
        name: 'Test Project',
        email: 'project@test.com',
        clientId: clientId,
        notes: 'Test project notes',
        projectCode: 'PRJ001',
        address: {
            street: 'Main St',
            number: '10',
            postal: '28001',
            city: 'Madrid',
            province: 'Madrid'
        },
        active: true
    };

    beforeAll(async () => {
        let res = await request(app)
            .post('/api/user/register')
            .send(testUser);
        
        token = res.body.accessToken;
        userId = res.body.user._id;

        res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(testClient);
        
        clientId = res.body._id;
        testProject.clientId = clientId;
    });

    describe('POST /api/project', () => {
        it('should create a new project successfully', async () => {
            const res = await request(app)
                .post('/api/project')
                .set('Authorization', `Bearer ${token}`)
                .send(testProject)
                .expect(201);

            expect(res.body.name).toBe(testProject.name);
            expect(res.body.email).toBe(testProject.email);
            expect(res.body.user).toBe(userId.toString());
            expect(res.body.client).toBe(clientId.toString());
        });

        it('should reject project creation with missing data', async () => {
            await request(app)
                .post('/api/project')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Incomplete' })
                .expect(400);
        });

        it('should reject duplicate project code for the same user', async () => {
            await request(app)
                .post('/api/project')
                .set('Authorization', `Bearer ${token}`)
                .send(testProject)
                .expect(400);
        });
    });

    describe('GET /api/project', () => {
        it('should list projects with pagination', async () => {
            const res = await request(app)
                .get('/api/project')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(res.body).toHaveProperty('totalItems');
            expect(res.body).toHaveProperty('projects');
            expect(Array.isArray(res.body.projects)).toBe(true);
        });

        it('should filter projects by name', async () => {
            const res = await request(app)
                .get('/api/project')
                .set('Authorization', `Bearer ${token}`)
                .query({ name: 'Test' })
                .expect(200);

            res.body.projects.forEach(project => {
                expect(project.name).toMatch(/Test/i);
            });
        });
    });

    describe('GET /api/project/:id', () => {
        it('should get a project by ID', async () => {
            const project = await Project.findOne({ user: userId, deleted: false });

            const res = await request(app)
                .get(`/api/project/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('name');
            expect(res.body.name).toBe(project.name);
        });
    });    

    describe('PUT /api/project/:id', () => {
        it('should update project details', async () => {
            const project = await Project.findOne({ user: userId });
            const newName = 'Updated Project Name';

            const res = await request(app)
                .put(`/api/project/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: newName })
                .expect(200);

            expect(res.body.name).toBe(newName);
        });
    });

    describe('DELETE /api/project/:id', () => {
        it('should soft delete a project', async () => {
            const project = await Project.findOne({ user: userId, deleted: false });

            await request(app)
                .delete(`/api/project/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' })
                .expect(200);

            const updatedProject = await Project.findById(project._id);
            expect(updatedProject.deleted).toBe(true);
        });

        it('should restore a soft-deleted project', async () => {
            const project = await Project.findOne({ user: userId, deleted: true });

            await request(app)
                .patch(`/api/project/${project._id}/restore`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const updatedProject = await Project.findById(project._id);
            expect(updatedProject.deleted).toBe(false);
        });

        it('should hard delete a project', async () => {
            const project = await Project.findOne({ user: userId });

            await request(app)
                .delete(`/api/project/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'false' })
                .expect(200);

            const deletedProject = await Project.findById(project._id);
            expect(deletedProject).toBeNull();
        });
    });

    describe('GET /api/project/archived', () => {
        it('should list only archived (soft-deleted) projects', async () => {
            const project = await Project.create({
                ...testProject,
                user: userId,
                company: companyId,
                deleted: true
            });

            const res = await request(app)
                .get('/api/project/archived')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(p => {
                expect(p.deleted).toBe(true);
            });

            const found = res.body.find(p => p._id.toString() === project._id.toString());
            expect(found).toBeDefined();
        });

        it('should filter archived projects by name', async () => {
            const res = await request(app)
                .get('/api/project/archived')
                .set('Authorization', `Bearer ${token}`)
                .query({ name: 'Test' })
                .expect(200);

            res.body.forEach(p => {
                expect(p.name).toMatch(/Test/i);
            });
        });
    });

    describe('PATCH /api/project/:id/restore', () => {
        it('should restore a soft-deleted project successfully', async () => {
            const project = await Project.findOne({ company: companyId, deleted: true });

            const res = await request(app)
                .patch(`/api/project/${project._id}/restore`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body.deleted).toBe(false);

            const updatedProject = await Project.findById(project._id);
            expect(updatedProject.deleted).toBe(false);
        });

        it('should return 404 when trying to restore a non-existent project', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .patch(`/api/project/${fakeId}/restore`)
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });
    });
});