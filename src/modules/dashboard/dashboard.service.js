import db from '../../config/database.js';

export const getSummary = () => {
  const query = `
    SELECT 
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpenses
    FROM financial_records 
    WHERE deleted_at IS NULL
  `;
  
  const result = db.prepare(query).get();
  const totalIncome = result.totalIncome || 0;
  const totalExpenses = result.totalExpenses || 0;
  
  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses
  };
};

export const getCategoryBreakdown = () => {
  const query = `
    SELECT category, type, SUM(amount) as total
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `;
  
  return db.prepare(query).all();
};

export const getTrends = () => {
  // SQLite strftime for month grouping
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
    LIMIT 12
  `;
  
  return db.prepare(query).all();
};

export const getRecentActivity = (limit = 5) => {
  const query = `
    SELECT id, amount, type, category, date, description
    FROM financial_records
    WHERE deleted_at IS NULL
    ORDER BY date DESC, created_at DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
};
