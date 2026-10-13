import pg from 'pg';

const { Pool } = pg;

/** Creates the PostgreSQL connection pool from environment configuration. */
export function createDatabasePool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: true }
        : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}