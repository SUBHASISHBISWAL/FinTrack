import pool from '../config/database.js';
import logger from '../utils/logger.js';

const migrations = [
  {
    version: 1,
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('VIEWER', 'ANALYST', 'ADMIN') DEFAULT 'VIEWER',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    version: 2,
    name: 'create_financial_records_table',
    sql: `
      CREATE TABLE IF NOT EXISTS financial_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        type ENUM('INCOME', 'EXPENSE') NOT NULL,
        category VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    version: 3,
    name: 'create_refresh_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

const migrate = async () => {
  logger.info('Starting database migration...');

  try {
    const connection = await pool.getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await connection.execute('SELECT version FROM _migrations');
    const applied = rows.map(r => r.version);

    await connection.beginTransaction();

    try {
      for (const migration of migrations) {
        if (applied.includes(migration.version)) {
          logger.info(`  Skipping migration v${migration.version}: ${migration.name} (already applied)`);
          continue;
        }

        logger.info(`  Applying migration v${migration.version}: ${migration.name}`);
        // For DDL statements, we use connection.query because connection.execute requires parameterization 
        // which some drivers dislike for DDL.
        await connection.query(migration.sql);
        await connection.execute('INSERT INTO _migrations (version, name) VALUES (?, ?)', [migration.version, migration.name]);
      }

      await connection.commit();
      logger.info('Migration completed successfully.');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
