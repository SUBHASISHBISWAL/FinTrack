import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { UnauthorizedError } from '../utils/app-error.js';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    const [users] = await pool.execute('SELECT id, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL', [decoded.id]);
    const user = users[0];

    if (!user) {
      throw new UnauthorizedError('User not found or deleted');
    }
    
    if (!user.is_active) {
      throw new UnauthorizedError('User account is inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(new UnauthorizedError(error.message || 'Invalid token'));
    }
  }
};
