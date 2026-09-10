import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './pool.js';
const root = join(process.cwd(), 'src', 'infrastructure', 'database', 'migrations');
async function main() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  for (const name of (await readdir(root)).sort()) {
    const done = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
    if (done.rowCount) continue;
    const sql = await readFile(join(root, name, 'up.sql'), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Aplicada: ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  await pool.end();
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
