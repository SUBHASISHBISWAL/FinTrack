import db from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/app-error.js';

const UPDATABLE_RECORD_COLUMNS = ['amount', 'type', 'category', 'date', 'description'];

const toSqlValue = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const createRecord = (data, userId) => {
  const insert = db.prepare(`
    INSERT INTO financial_records (amount, type, category, date, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const info = insert.run(
    data.amount,
    data.type,
    data.category,
    toSqlValue(data.date),
    toSqlValue(data.description),
    userId
  );
  return getRecordById(info.lastInsertRowid);
};

export const getRecords = (filters) => {
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
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const totalObject = db.prepare(countQuery).get(...queryParams);
  const total = totalObject.total;
  
  // Pagination
  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  queryParams.push(filters.limit, (filters.page - 1) * filters.limit);
  
  const records = db.prepare(query).all(...queryParams);
  
  return {
    data: records,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit)
    }
  };
};

export const getRecordById = (id) => {
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!record) {
    throw new NotFoundError(`Financial record with id ${id} not found`);
  }
  return record;
};

export const updateRecord = (id, data) => {
  getRecordById(id);
  
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
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE financial_records SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  db.prepare(sql).run(...params);
  
  return getRecordById(id);
};

export const deleteRecord = (id) => {
  getRecordById(id);
  
  db.prepare("UPDATE financial_records SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return { id, deleted: true };
};

export const restoreRecord = (id) => {
  const record = db.prepare('SELECT id, deleted_at FROM financial_records WHERE id = ?').get(id);
  if (!record) {
    throw new NotFoundError(`Financial record with id ${id} not found`);
  }
  if (!record.deleted_at) {
    throw new ConflictError('Record is not deleted');
  }
  db.prepare("UPDATE financial_records SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return getRecordById(id);
};
