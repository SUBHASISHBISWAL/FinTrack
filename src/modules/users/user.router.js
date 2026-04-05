import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema, userIdParamSchema } from './user.schema.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Forbidden
 */
router.get('/', userController.getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: User not found
 */
router.get('/:id', validate(userIdParamSchema, 'params'), userController.getUserById);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role or status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       409:
 *         description: No changes detected
 */
router.patch('/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       409:
 *         description: Cannot delete self
 */
router.delete('/:id', validate(userIdParamSchema, 'params'), userController.deleteUser);

/**
 * @openapi
 * /api/users/{id}/restore:
 *   patch:
 *     tags: [Users]
 *     summary: Restore a soft-deleted user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User restored
 *       404:
 *         description: User not found
 *       409:
 *         description: User is not deleted
 */
router.patch('/:id/restore', validate(userIdParamSchema, 'params'), userController.restoreUser);

export default router;
