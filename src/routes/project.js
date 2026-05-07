import express from 'express';
import * as projectController from '../controllers/projectController.js';
import authMiddleware from '../middleware/session.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema } from '../validators/project.validator.js';

const router = express.Router();

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags:
 *       - Project
 *     summary: Create a new project
 *     description: Registers a project associated with a client and the user's company. Validates that the project code is unique within the company.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Project created successfully.
 *       400:
 *         description: Validation error or duplicate project code.
 */
router.post('/', authMiddleware, validate(createProjectSchema), projectController.create);

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags:
 *       - Project
 *     summary: List projects
 *     description: Retrieves company projects with support for pagination and filters by client, name, or active status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page.
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter by client ID.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial search).
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive projects.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sorting field.
 *     responses:
 *       200:
 *         description: Paginated list of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems: { type: integer }
 *                 totalPages: { type: integer }
 *                 currentPage: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 */
router.get('/', authMiddleware, projectController.getAll);

/**
 * @openapi
 * /api/project/{id}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get a project by ID
 *     description: Shows details of a specific project, including associated client data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project data.
 *       404:
 *         description: Project not found.
 */
router.get('/:id', authMiddleware, projectController.getById);

/**
 * @openapi
 * /api/project/{id}:
 *   put:
 *     tags:
 *       - Project
 *     summary: Update a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated.
 */
router.put('/:id', authMiddleware, projectController.update);

/**
 * @openapi
 * /api/project/{id}:
 *   delete:
 *     tags:
 *       - Project
 *     summary: Delete or archive a project
 *     description: Allows physical or logical (archive) deletion using the `soft` query parameter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           default: true
 *         description: If true, archives the project instead of deleting it permanently.
 *     responses:
 *       200:
 *         description: Project deleted or archived.
 */
router.delete('/:id', authMiddleware, projectController.erase);

/**
 * @openapi
 * /api/project/archived:
 *   get:
 *     tags:
 *       - Project
 *     summary: List archived projects
 *     description: Retrieves all company projects that have been logically deleted.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived projects.
 */
router.get('/archived', authMiddleware, projectController.getAllArchived);

/**
 * @openapi
 * /api/project/{id}/restore:
 *   patch:
 *     tags:
 *       - Project
 *     summary: Restore an archived project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project restored successfully.
 */
router.patch('/:id/restore', authMiddleware, projectController.restore);

export default router;