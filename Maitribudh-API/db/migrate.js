import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabasePool } from '../src/config/database.js';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const lockId = 1296126531;

async function runMigrations() {
  const pool = createDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockId]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        migration_name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/.test(name))
      .sort();

    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query(
        'SELECT checksum FROM public.schema_migrations WHERE migration_name = $1',
        [name],
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Applied migration was modified: ${name}`);
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (migration_name, checksum) VALUES ($1, $2)',
          [name, checksum],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [lockId]).catch(() => {});
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Database migrations failed:', error.message);
  process.exitCode = 1;
});