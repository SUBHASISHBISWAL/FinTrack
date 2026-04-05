import bcrypt from 'bcrypt';
import db from '../config/database.js';

const seed = async () => {
  console.log('Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing data (optional, but good for idempotent seeding)
  db.exec('DELETE FROM financial_records; DELETE FROM users;');

  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  );

  const adminId = insertUser.run('admin@example.com', passwordHash, 'Admin User', 'ADMIN').lastInsertRowid;
  const analystId = insertUser.run('analyst@example.com', passwordHash, 'Analyst User', 'ANALYST').lastInsertRowid;
  const viewerId = insertUser.run('viewer@example.com', passwordHash, 'Viewer User', 'VIEWER').lastInsertRowid;

  const insertRecord = db.prepare(
    'INSERT INTO financial_records (amount, type, category, date, description, user_id) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Sample records
  const records = [
    { amount: 5000, type: 'INCOME', category: 'Salary', date: '2023-10-01', description: 'October Salary', user_id: adminId },
    { amount: 1500, type: 'EXPENSE', category: 'Rent', date: '2023-10-05', description: 'Office Rent', user_id: adminId },
    { amount: 200, type: 'EXPENSE', category: 'Utilities', date: '2023-10-10', description: 'Internet Bill', user_id: analystId },
    { amount: 1200, type: 'INCOME', category: 'Consulting', date: '2023-10-15', description: 'Client A', user_id: adminId },
    { amount: 300, type: 'EXPENSE', category: 'Software', date: '2023-10-20', description: 'SaaS Subscriptions', user_id: adminId },
  ];

  for (const record of records) {
    insertRecord.run(record.amount, record.type, record.category, record.date, record.description, record.user_id);
  }

  console.log('Database seeded successfully.');
};

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
