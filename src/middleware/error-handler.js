import { AppError } from '../utils/app-error.js';
import { env } from '../config/environment.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Check for Joi validation error
    statusCode = 400;
    message = err.message;
  }

  const response = {
    status: 'error',
    message,
  };

  if (env.env === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled server error');
  } else {
    logger.warn({ statusCode, message, method: req.method, url: req.originalUrl }, 'Client error');
  }

  res.status(statusCode).json(response);
};
