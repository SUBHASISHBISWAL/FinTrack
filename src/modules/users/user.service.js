import db from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/app-error.js';

export const getAllUsers = () => {
  return db.prepare('SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE deleted_at IS NULL').all();
};

export const getUserById = (id) => {
  const user = db.prepare('SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }
  return user;
};

export const updateUser = (id, updateData) => {
  const user = getUserById(id);
  
  const updates = [];
  const params = [];
  let hasChanges = false;
  
  if (updateData.role !== undefined && updateData.role !== user.role) {
    updates.push('role = ?');
    params.push(updateData.role);
    hasChanges = true;
  }
  
  if (updateData.is_active !== undefined) {
    const isActiveInt = updateData.is_active ? 1 : 0;
    if (isActiveInt !== user.is_active) {
      updates.push('is_active = ?');
      params.push(isActiveInt);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
    
    return getUserById(id);
  }
  
  throw new ConflictError('No changes detected: The user already has the requested status/role.');
};

export const deleteUser = (id, requestingUserId) => {
  if (Number(id) === Number(requestingUserId)) {
    throw new ConflictError('Cannot delete your own account');
  }
  getUserById(id);
  db.prepare("UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return { id, deleted: true };
};

export const restoreUser = (id) => {
  const user = db.prepare('SELECT id, email, name, role, is_active, deleted_at FROM users WHERE id = ?').get(id);
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }
  if (!user.deleted_at) {
    throw new ConflictError('User is not deleted');
  }
  db.prepare("UPDATE users SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return getUserById(id);
};
