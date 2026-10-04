import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDatabase } from './client';

/** Applies the SQL migrations in /drizzle. Used by the CLI, the test setup and CI. */
export async function runMigrations(url: string): Promise<void> {
  const { db, sql } = createDatabase(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
  } finally {
    await sql.end();
  }
}
