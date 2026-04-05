import Joi from 'joi';

export const updateUserSchema = Joi.object({
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN'),
  is_active: Joi.boolean()
}).min(1);

export const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});
