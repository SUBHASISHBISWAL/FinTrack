import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = userService.getAllUsers();
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = userService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = userService.updateUser(req.params.id, req.body);
    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = userService.deleteUser(req.params.id);
    sendSuccess(res, result, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};
