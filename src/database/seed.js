import bcrypt from 'bcrypt';
import db from '../config/database.js';
import logger from '../utils/logger.js';

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const seed = async () => {
  logger.info('Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const runSeed = db.transaction(() => {
    db.exec('DELETE FROM financial_records; DELETE FROM users;');

    const insertUser = db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );

    const adminId = insertUser.run('admin@example.com', passwordHash, 'Admin User', 'ADMIN').lastInsertRowid;
    const analystId = insertUser.run('analyst@example.com', passwordHash, 'Analyst User', 'ANALYST').lastInsertRowid;
    insertUser.run('viewer@example.com', passwordHash, 'Viewer User', 'VIEWER');

    const insertRecord = db.prepare(
      'INSERT INTO financial_records (amount, type, category, date, description, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const records = [
      { amount: 5000, type: 'INCOME', category: 'Salary', date: daysAgo(30), description: 'Monthly Salary', userId: adminId },
      { amount: 1500, type: 'EXPENSE', category: 'Rent', date: daysAgo(25), description: 'Office Rent', userId: adminId },
      { amount: 200, type: 'EXPENSE', category: 'Utilities', date: daysAgo(20), description: 'Internet Bill', userId: analystId },
      { amount: 1200, type: 'INCOME', category: 'Consulting', date: daysAgo(15), description: 'Client A', userId: adminId },
      { amount: 300, type: 'EXPENSE', category: 'Software', date: daysAgo(10), description: 'SaaS Subscriptions', userId: adminId },
      { amount: 4800, type: 'INCOME', category: 'Salary', date: daysAgo(60), description: 'Previous Month Salary', userId: adminId },
      { amount: 750, type: 'EXPENSE', category: 'Marketing', date: daysAgo(45), description: 'Ad Campaign', userId: adminId },
      { amount: 2000, type: 'INCOME', category: 'Freelance', date: daysAgo(5), description: 'Project Payment', userId: analystId },
    ];

    for (const record of records) {
      insertRecord.run(record.amount, record.type, record.category, record.date, record.description, record.userId);
    }
  });

  runSeed();
  logger.info('Database seeded successfully.');
};

seed().catch(err => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});
