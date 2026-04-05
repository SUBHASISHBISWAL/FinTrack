import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    sendSuccess(res, user, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body);
    sendSuccess(res, data, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const data = authService.refreshAccessToken(req.body.refreshToken);
    sendSuccess(res, data, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const data = authService.logoutUser(req.body.refreshToken);
    sendSuccess(res, data, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
