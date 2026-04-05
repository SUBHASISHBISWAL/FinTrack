import db from '../config/database.js';

const migrate = () => {
  console.log('Starting database migration...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('VIEWER', 'ANALYST', 'ADMIN')) NOT NULL DEFAULT 'VIEWER',
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('INCOME', 'EXPENSE')) NOT NULL,
      category TEXT NOT NULL,
      date DATETIME NOT NULL,
      description TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records (type);
    CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records (category);
    CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records (date);
    CREATE INDEX IF NOT EXISTS idx_records_user_id ON financial_records (user_id);
  `);

  console.log('Migration completed successfully.');
};

migrate();
