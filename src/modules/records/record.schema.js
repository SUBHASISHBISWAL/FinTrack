import Joi from 'joi';
import { PAGINATION } from '../../utils/constants.js';

export const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('INCOME', 'EXPENSE').required(),
  category: Joi.string().required(),
  date: Joi.date().iso().required(),
  description: Joi.string().allow('', null)
});

export const updateRecordSchema = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid('INCOME', 'EXPENSE'),
  category: Joi.string(),
  date: Joi.date().iso(),
  description: Joi.string().allow('', null)
}).min(1);

export const recordIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const queryRecordsSchema = Joi.object({
  type: Joi.string().valid('INCOME', 'EXPENSE'),
  category: Joi.string(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  search: Joi.string(),
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
});
