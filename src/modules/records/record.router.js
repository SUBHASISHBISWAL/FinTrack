import { Router } from 'express';
import * as recordController from './record.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createRecordSchema, updateRecordSchema, recordIdParamSchema, queryRecordsSchema } from './record.schema.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createRecordSchema),
  recordController.createRecord
);

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records with filters (Admin, Analyst)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated records
 */
router.get(
  '/',
  authorize('ADMIN', 'ANALYST'),
  validate(queryRecordsSchema, 'query'),
  recordController.getRecords
);

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single record (Admin, Analyst)
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
 *         description: Record not found
 */
router.get(
  '/:id',
  authorize('ADMIN', 'ANALYST'),
  validate(recordIdParamSchema, 'params'),
  recordController.getRecordById
);

/**
 * @openapi
 * /api/records/{id}:
 *   patch:
 *     tags: [Records]
 *     summary: Update a financial record (Admin only)
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  validate(updateRecordSchema),
  recordController.updateRecord
);

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete a record (Admin only)
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
 *         description: Record deleted
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  recordController.deleteRecord
);

/**
 * @openapi
 * /api/records/{id}/restore:
 *   patch:
 *     tags: [Records]
 *     summary: Restore a soft-deleted record (Admin only)
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
 *         description: Record restored
 *       404:
 *         description: Record not found
 *       409:
 *         description: Record is not deleted
 */
router.patch(
  '/:id/restore',
  authorize('ADMIN'),
  validate(recordIdParamSchema, 'params'),
  recordController.restoreRecord
);

export default router;
