import express from 'express';
import * as userController from '../controllers/userController.js';
import authMiddleware from '../middleware/session.js';
import checkRol from '../middleware/role.js';
import uploadMiddleware from '../utils/handleStorage.js';

const router = express.Router();

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Initial user registration
 *     description: Creates a user account with email and password. Returns a JWT token for subsequent steps.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@company.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Invalid data or user already exists.
 */
router.post('/register', userController.register);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: User login
 *     description: Authenticates the user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "admin@company.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Successful login.
 *       401:
 *         description: Invalid credentials.
 */
router.post('/login', userController.login);

/**
 * @openapi
 * /api/user/validation:
 *   put:
 *     tags:
 *       - User
 *     summary: Email validation
 *     description: Validates the email address using the code sent after registration.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: integer, example: 123456 }
 *     responses:
 *       200:
 *         description: Email validated successfully.
 *       400:
 *         description: Incorrect or expired code.
 */
router.put('/validation', authMiddleware, userController.validateEmail);

/**
 * @openapi
 * /api/user/register:
 *   put:
 *     tags:
 *       - User
 *     summary: Complete personal profile
 *     description: Updates profile data (first name, last name, NIF, address) after validation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Profile updated.
 */
router.put('/register', authMiddleware, userController.updateProfile);

/**
 * @openapi
 * /api/user/company:
 *   patch:
 *     tags:
 *       - User
 *     summary: Create or update company
 *     description: Links the user to a company.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company data saved.
 */
router.patch('/company', authMiddleware, userController.updateCompany);

/**
 * @openapi
 * /api/user/logo:
 *   patch:
 *     tags:
 *       - User
 *     summary: Upload company logo
 *     description: Uploads an image for the company logo using multipart/form-data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Logo updated successfully.
 */
router.patch('/logo', uploadMiddleware.any(), authMiddleware, userController.updateLogo);

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags:
 *       - User
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/', authMiddleware, userController.getUser);

/**
 * @openapi
 * /api/user/refresh:
 *   post:
 *     tags:
 *       - User
 *     summary: Refresh token
 *     responses:
 *       200:
 *         description: New token generated.
 */
router.post('/refresh', userController.refreshToken);

/**
 * @openapi
 * /api/user/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Session closed.
 */
router.post('/logout', authMiddleware, userController.logout);

/**
 * @openapi
 * /api/user:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete account
 *     description: Permanently deletes the account of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted.
 */
router.delete('/', authMiddleware, userController.deleteAccount);

/**
 * @openapi
 * /api/user/password:
 *   put:
 *     tags:
 *       - User
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed successfully.
 */
router.put('/password', authMiddleware, userController.updatePassword);

/**
 * @openapi
 * /api/user/invite:
 *   post:
 *     tags:
 *       - User
 *     summary: Invite user (Admin only)
 *     description: Allows an administrator to invite a new user to join their company.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               role: { type: string, enum: [admin, guest] }
 *     responses:
 *       201:
 *         description: Invitation sent.
 */
router.post('/invite', authMiddleware, checkRol(['admin']), userController.sendInvite);

export default router;