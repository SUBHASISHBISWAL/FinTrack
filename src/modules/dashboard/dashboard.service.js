import pool from '../../config/database.js';
import { DASHBOARD } from '../../utils/constants.js';

export const getSummary = async () => {
  const query = `
    SELECT 
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpenses
    FROM financial_records 
    WHERE deleted_at IS NULL
  `;
  
  const [rows] = await pool.execute(query);
  const result = rows[0];
  const totalIncome = result.totalIncome ? Number(result.totalIncome) : 0;
  const totalExpenses = result.totalExpenses ? Number(result.totalExpenses) : 0;
  
  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses
  };
};

export const getCategoryBreakdown = async () => {
  const query = `
    SELECT category, type, SUM(amount) as total
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `;
  
  const [rows] = await pool.execute(query);
  return rows.map(r => ({ ...r, total: Number(r.total) }));
};

export const getTrends = async () => {
  const query = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month ASC
    LIMIT ${DASHBOARD.TRENDS_MONTH_LIMIT}
  `;
  
  const [rows] = await pool.execute(query);
  return rows.map(r => ({ ...r, income: Number(r.income), expense: Number(r.expense) }));
};

export const getRecentActivity = async (limit = DASHBOARD.RECENT_ACTIVITY_DEFAULT_LIMIT) => {
  const query = `
    SELECT id, amount, type, category, date, description
    FROM financial_records
    WHERE deleted_at IS NULL
    ORDER BY date DESC, created_at DESC
    LIMIT ?
  `;
  
  const [rows] = await pool.query(query, [Number(limit)]);
  return rows;
};
