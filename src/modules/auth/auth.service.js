import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import pool from '../../config/database.js';
import { env } from '../../config/environment.js';
import { UnauthorizedError, ConflictError } from '../../utils/app-error.js';
import { AUTH } from '../../utils/constants.js';

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(AUTH.REFRESH_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.auth.refreshTokenExpiryDays);

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt.toISOString().slice(0, 19).replace('T', ' ')]
  );

  return token;
};

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  const [users] = await pool.execute('SELECT id, deleted_at FROM users WHERE email = ?', [email]);
  const existingUser = users[0];
  if (existingUser && !existingUser.deleted_at) {
    throw new ConflictError('Email already in use');
  }
  if (existingUser && existingUser.deleted_at) {
    throw new ConflictError('Email belongs to a deactivated account. Contact an administrator.');
  }

  const passwordHash = await bcrypt.hash(password, env.auth.bcryptSaltRounds);
  
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [email, passwordHash, name, role || 'VIEWER']
  );
  
  const [newUsers] = await pool.execute('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?', [result.insertId]);
  
  return newUsers[0];
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const [users] = await pool.execute(
    'SELECT id, email, name, role, password_hash, is_active FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  const user = users[0];
  
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
    { expiresIn: env.auth.accessTokenExpiry }
  );

  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  const [tokens] = await pool.execute(
    'SELECT rt.*, u.id as uid, u.email, u.role, u.is_active FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = ?',
    [refreshToken]
  );
  const stored = tokens[0];

  if (!stored) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (new Date(stored.expires_at) < new Date()) {
    await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    throw new UnauthorizedError('Refresh token expired');
  }

  if (!stored.is_active) {
    throw new UnauthorizedError('User account is inactive');
  }

  const accessToken = jwt.sign(
    { id: stored.uid, email: stored.email, role: stored.role },
    env.jwtSecret,
    { expiresIn: env.auth.accessTokenExpiry }
  );

  return { accessToken };
};

export const logoutUser = async (refreshToken) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
  return { loggedOut: true };
};

export const revokeUserTokens = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  return { revoked: true };
};
