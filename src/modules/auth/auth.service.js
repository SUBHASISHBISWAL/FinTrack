import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../config/database.js';
import { env } from '../../config/environment.js';
import { UnauthorizedError, ValidationError } from '../../utils/app-error.js';

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    throw new ValidationError('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  );
  
  const info = insertUser.run(email, passwordHash, name, role || 'VIEWER');
  
  const newUser = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  
  return newUser;
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL').get(email);
  
  if (!user || user.is_active === 0) {
    throw new UnauthorizedError('Invalid credentials or inactive account');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  };
};
