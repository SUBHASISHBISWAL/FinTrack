import pool from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/app-error.js';
import { revokeUserTokens } from '../auth/auth.service.js';

export const getAllUsers = async () => {
  const [users] = await pool.execute('SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE deleted_at IS NULL');
  return users;
};

export const getUserById = async (id) => {
  const [users] = await pool.execute('SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
  const user = users[0];
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }
  return user;
};

export const updateUser = async (id, updateData) => {
  const user = await getUserById(id);
  
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
    // updated_at is handled automatically by MySQL
    params.push(id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    await pool.execute(sql, params);

    // If deactivated, revoke tokens
    if (updateData.is_active === false) {
      await revokeUserTokens(id);
    }
    
    return getUserById(id);
  }
  
  throw new ConflictError('No changes detected: The user already has the requested status/role.');
};

export const deleteUser = async (id, requestingUserId) => {
  if (Number(id) === Number(requestingUserId)) {
    throw new ConflictError('Cannot delete your own account');
  }
  await getUserById(id);
  await pool.execute("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  return { id, deleted: true };
};

export const restoreUser = async (id) => {
  const [users] = await pool.execute('SELECT id, email, name, role, is_active, deleted_at FROM users WHERE id = ?', [id]);
  const user = users[0];
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }
  if (!user.deleted_at) {
    throw new ConflictError('User is not deleted');
  }
  await pool.execute("UPDATE users SET deleted_at = NULL WHERE id = ?", [id]);
  return getUserById(id);
};
