import db from '../../config/database.js';
import { NotFoundError } from '../../utils/app-error.js';

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
  
  if (updateData.role !== undefined) {
    updates.push('role = ?');
    params.push(updateData.role);
  }
  
  if (updateData.is_active !== undefined) {
    // SQLite uses 1/0 for boolean true/false
    updates.push('is_active = ?');
    params.push(updateData.is_active ? 1 : 0);
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }
  
  return getUserById(id);
};

export const deleteUser = (id) => {
  const user = getUserById(id);
  db.prepare("UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return { id, deleted: true };
};
