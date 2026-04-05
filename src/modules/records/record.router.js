import { Router } from 'express';
import * as recordController from './record.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createRecordSchema, updateRecordSchema, recordIdParamSchema, queryRecordsSchema } from './record.schema.js';

const router = Router();

// All record endpoints require authentication
router.use(authenticate);

// Create record - Admin only
router.post(
  '/', 
  authorize('ADMIN'), 
  validate(createRecordSchema), 
  recordController.createRecord
);

// Get records - Admin and Analyst
router.get(
  '/', 
  authorize('ADMIN', 'ANALYST'), 
  validate(queryRecordsSchema, 'query'), 
  recordController.getRecords
);

// Get single record - Admin and Analyst
router.get(
  '/:id', 
  authorize('ADMIN', 'ANALYST'), 
  validate(recordIdParamSchema, 'params'), 
  recordController.getRecordById
);

// Update record - Admin only
router.patch(
  '/:id', 
  authorize('ADMIN'), 
  validate(recordIdParamSchema, 'params'), 
  validate(updateRecordSchema), 
  recordController.updateRecord
);

// Delete record - Admin only
router.delete(
  '/:id', 
  authorize('ADMIN'), 
  validate(recordIdParamSchema, 'params'), 
  recordController.deleteRecord
);

export default router;
