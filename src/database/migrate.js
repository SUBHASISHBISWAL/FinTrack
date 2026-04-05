import db from '../config/database.js';
import logger from '../utils/logger.js';

const migrations = [
  {
    version: 1,
    name: 'create_users_table',
    sql: `
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
    `,
  },
  {
    version: 2,
    name: 'create_financial_records_table',
    sql: `
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
    `,
  },
  {
    version: 3,
    name: 'create_refresh_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `,
  },
];

const migrate = () => {
  logger.info('Starting database migration...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.prepare('SELECT version FROM _migrations').all().map(r => r.version);

  const runMigrations = db.transaction(() => {
    for (const migration of migrations) {
      if (applied.includes(migration.version)) {
        logger.info(`  Skipping migration v${migration.version}: ${migration.name} (already applied)`);
        continue;
      }

      logger.info(`  Applying migration v${migration.version}: ${migration.name}`);
      db.exec(migration.sql);
      db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
    }
  });

  runMigrations();
  logger.info('Migration completed successfully.');
};

migrate();

