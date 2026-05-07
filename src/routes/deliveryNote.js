import express from 'express';
import * as deliveryNoteController from '../controllers/deliveryNoteController.js';
import authMiddleware from '../middleware/session.js';
import { validate } from '../middleware/validate.js';
import { createDeliveryNoteSchema } from '../validators/deliveryNote.validator.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags:
 *       - DeliveryNote
 *     summary: Create a new delivery note
 *     description: Registers a delivery note of type 'material' or 'hours' associated with a project.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201:
 *         description: Delivery note created successfully.
 */
router.post('/', authMiddleware, validate(createDeliveryNoteSchema), deliveryNoteController.create);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: List delivery notes
 *     description: Retrieves company delivery notes with filters by project, client, format, signature status, and date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page.
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Filter by project ID.
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *         description: Filter by client ID.
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [material, hours] }
 *         description: Filter by format type.
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *         description: Filter by signature status.
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start date (YYYY-MM-DD).
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End date (YYYY-MM-DD).
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: "-workDate" }
 *         description: Sort field.
 *     responses:
 *       200:
 *         description: Paginated list of delivery notes.
 */
router.get('/', authMiddleware, deliveryNoteController.getAll);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Get delivery note details
 *     description: Returns the delivery note with populated user, client, and project data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery note data.
 */
router.get('/:id', authMiddleware, deliveryNoteController.getById);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags:
 *       - DeliveryNote
 *     summary: Delete a delivery note
 *     description: Can only be deleted if the delivery note is NOT signed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery note deleted.
 *       400:
 *         description: A signed delivery note cannot be deleted.
 */
router.delete('/:id', authMiddleware, deliveryNoteController.erase);

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Download delivery note as PDF
 *     description: Generates and downloads the PDF. If it already exists in the cloud (signed), it downloads it from there.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/pdf/:id', authMiddleware, deliveryNoteController.downloadPdf);

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags:
 *       - DeliveryNote
 *     summary: Sign a delivery note
 *     description: Receives the signature image, optimizes it with Sharp, uploads it to Cloudinary, and generates the signed PDF.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Signature image.
 *     responses:
 *       200:
 *         description: Delivery note signed and PDF generated.
 *       400:
 *         description: The delivery note was already signed.
 */
router.patch('/:id/sign', authMiddleware, upload.single('signature'), deliveryNoteController.sign);

export default router;