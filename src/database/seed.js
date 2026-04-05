import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { env } from '../config/environment.js';

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const seed = async () => {
  logger.info('Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', env.auth.bcryptSaltRounds);

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Clear existing records in proper order to avoid FK constraints
      await connection.execute('DELETE FROM refresh_tokens');
      await connection.execute('DELETE FROM financial_records');
      await connection.execute('DELETE FROM users');

      // Create Admin
      const [adminResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['admin@example.com', passwordHash, 'Admin User', 'ADMIN']
      );
      const adminId = adminResult.insertId;

      // Create Analyst
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['analyst@example.com', passwordHash, 'Analyst User', 'ANALYST']
      );

      // Create Viewer
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['viewer@example.com', passwordHash, 'Viewer User', 'VIEWER']
      );

      // Seed records for Admin
      const insertRecord = 'INSERT INTO financial_records (amount, type, category, date, description, user_id) VALUES (?, ?, ?, ?, ?, ?)';
      
      const records = [
        [5000.00, 'INCOME', 'Salary', daysAgo(10), 'Monthly salary', adminId],
        [1500.00, 'EXPENSE', 'Rent', daysAgo(9), 'Apartment rent', adminId],
        [300.00, 'EXPENSE', 'Groceries', daysAgo(5), 'Weekly groceries', adminId],
        [800.00, 'INCOME', 'Freelance', daysAgo(2), 'Web project', adminId],
        [100.00, 'EXPENSE', 'Utilities', daysAgo(1), 'Electric bill', adminId],
      ];

      for (const record of records) {
        await connection.execute(insertRecord, record);
      }

      await connection.commit();
      logger.info('Database seeded successfully.');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } finally {
    await pool.end();
  }
};

seed().catch(err => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});
