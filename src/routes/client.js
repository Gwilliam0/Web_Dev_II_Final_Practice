import express from 'express';
import * as clientController from '../controllers/clientController.js';
import authMiddleware from '../middleware/session.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema } from '../validators/client.validator.js';

const router = express.Router();

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags:
 *       - Client
 *     summary: Create a new client
 *     description: Registers a client linked to the authenticated user's company. Verifies that the CIF is unique within the company.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully.
 *       400:
 *         description: Validation error or duplicate CIF.
 */
router.post('/', authMiddleware, validate(createClientSchema), clientController.create);

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags:
 *       - Client
 *     summary: List clients
 *     description: Retrieves company clients with support for pagination and filtering by name.
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
 *         description: Amount of items per page.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial search).
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting field (e.g., createdAt or -createdAt).
 *     responses:
 *       200:
 *         description: Paginated list of clients.
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
 *                     $ref: '#/components/schemas/Client'
 */
router.get('/', authMiddleware, clientController.getAll);

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags:
 *       - Client
 *     summary: Get a client by ID
 *     description: Shows the details of a specific client belonging to the company.
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
 *         description: Client data.
 *       404:
 *         description: Client not found.
 */
router.get('/:id', authMiddleware, clientController.getById);

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags:
 *       - Client
 *     summary: Update a client
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
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated.
 */
router.put('/:id', authMiddleware, clientController.update);

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags:
 *       - Client
 *     summary: Delete or archive a client
 *     description: Performs a physical (hard) or logical (soft) deletion based on the query parameter.
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
 *         description: If true, performs logical deletion (archive).
 *     responses:
 *       200:
 *         description: Client deleted/archived successfully.
 */
router.delete('/:id', authMiddleware, clientController.erase);

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags:
 *       - Client
 *     summary: List archived clients
 *     description: Retrieves clients that have been marked with logical deletion.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived clients.
 */
router.get('/archived', authMiddleware, clientController.getAllArchived);

/**
 * @openapi
 * /api/client/{id}/restore:
 *   patch:
 *     tags:
 *       - Client
 *     summary: Restore an archived client
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
 *         description: Client restored successfully.
 */
router.patch('/:id/restore', authMiddleware, clientController.restore);

export default router;