import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema, userIdParamSchema } from './user.schema.js';

const router = Router();

// Keep everything admin-only for user management per requirements
router.use(authenticate, authorize('ADMIN'));

router.get('/', userController.getAllUsers);

router.get('/:id', validate(userIdParamSchema, 'params'), userController.getUserById);

router.patch('/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);

router.delete('/:id', validate(userIdParamSchema, 'params'), userController.deleteUser);

export default router;
