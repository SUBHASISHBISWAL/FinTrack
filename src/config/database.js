import Database from 'better-sqlite3';
import { env } from './environment.js';

const db = new Database(env.databaseUrl, {
  verbose: env.env === 'development' ? console.log : null,
});

// Enable WAL mode for better performance and concurrency
db.pragma('journal_mode = WAL');

export default db;
