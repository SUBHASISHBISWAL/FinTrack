import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db from '../../config/database.js';
import { env } from '../../config/environment.js';
import { UnauthorizedError, ConflictError } from '../../utils/app-error.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateRefreshToken = (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(userId, token, expiresAt.toISOString());

  return token;
};

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  const existingUser = db.prepare('SELECT id, deleted_at FROM users WHERE email = ?').get(email);
  if (existingUser && !existingUser.deleted_at) {
    throw new ConflictError('Email already in use');
  }
  if (existingUser && existingUser.deleted_at) {
    throw new ConflictError('Email belongs to a deactivated account. Contact an administrator.');
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

  const user = db.prepare(
    'SELECT id, email, name, role, password_hash, is_active FROM users WHERE email = ? AND deleted_at IS NULL'
  ).get(email);
  
  if (!user || user.is_active === 0) {
    throw new UnauthorizedError('Invalid credentials or inactive account');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = generateRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = (refreshToken) => {
  const stored = db.prepare(
    'SELECT rt.*, u.id as uid, u.email, u.role, u.is_active FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = ?'
  ).get(refreshToken);

  if (!stored) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (new Date(stored.expires_at) < new Date()) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    throw new UnauthorizedError('Refresh token expired');
  }

  if (!stored.is_active) {
    throw new UnauthorizedError('User account is inactive');
  }

  const accessToken = jwt.sign(
    { id: stored.uid, email: stored.email, role: stored.role },
    env.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return { accessToken };
};

export const logoutUser = (refreshToken) => {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  return { loggedOut: true };
};

export const revokeUserTokens = (userId) => {
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  return { revoked: true };
};

