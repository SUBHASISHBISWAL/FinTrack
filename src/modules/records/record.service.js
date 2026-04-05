import pool from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/app-error.js';

const UPDATABLE_RECORD_COLUMNS = ['amount', 'type', 'category', 'date', 'description'];

const toSqlValue = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value;
};

export const createRecord = async (data, userId) => {
  const sql = `
    INSERT INTO financial_records (amount, type, category, date, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(sql, [
    data.amount,
    data.type,
    data.category,
    toSqlValue(data.date),
    toSqlValue(data.description),
    userId
  ]);
  
  return getRecordById(result.insertId);
};

export const getRecords = async (filters) => {
  let query = 'SELECT * FROM financial_records WHERE deleted_at IS NULL';
  const queryParams = [];
  
  if (filters.type) {
    query += ' AND type = ?';
    queryParams.push(filters.type);
  }
  if (filters.category) {
    query += ' AND category = ?';
    queryParams.push(filters.category);
  }
  if (filters.dateFrom) {
    query += ' AND date >= ?';
    queryParams.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    query += ' AND date <= ?';
    queryParams.push(filters.dateTo);
  }
  if (filters.search) {
    query += ' AND (description LIKE ? OR category LIKE ?)';
    queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  // Count total for pagination
  const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS subquery`;
  const [countRows] = await pool.execute(countQuery, queryParams);
  const total = countRows[0].total;
  
  // Pagination
  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  queryParams.push(Number(filters.limit), Number((filters.page - 1) * filters.limit));
  
  const [records] = await pool.query(query, queryParams);
  
  return {
    data: records,
    meta: {
      total,
      page: Number(filters.page),
      limit: Number(filters.limit),
      totalPages: Math.ceil(total / filters.limit)
    }
  };
};

export const getRecordById = async (id) => {
  const [records] = await pool.execute('SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL', [id]);
  const record = records[0];
  if (!record) {
    throw new NotFoundError(`Financial record with id ${id} not found`);
  }
  return record;
};

export const updateRecord = async (id, data) => {
  await getRecordById(id);
  
  const updates = [];
  const params = [];
  
  for (const column of UPDATABLE_RECORD_COLUMNS) {
    if (data[column] !== undefined) {
      updates.push(`${column} = ?`);
      params.push(toSqlValue(data[column]));
    }
  }
  
  if (updates.length === 0) {
    return getRecordById(id);
  }
  
  params.push(id);
  
  const sql = `UPDATE financial_records SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  await pool.execute(sql, params);
  
  return getRecordById(id);
};

export const deleteRecord = async (id) => {
  await getRecordById(id);
  
  await pool.execute("UPDATE financial_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  return { id, deleted: true };
};

export const restoreRecord = async (id) => {
  const [records] = await pool.execute('SELECT id, deleted_at FROM financial_records WHERE id = ?', [id]);
  const record = records[0];
  if (!record) {
    throw new NotFoundError(`Financial record with id ${id} not found`);
  }
  if (!record.deleted_at) {
    throw new ConflictError('Record is not deleted');
  }
  await pool.execute("UPDATE financial_records SET deleted_at = NULL WHERE id = ?", [id]);
  return getRecordById(id);
};
