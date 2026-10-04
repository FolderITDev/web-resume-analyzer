import { runMigrations } from '../../src/server/db/migrate';
import { TEST_DATABASE_URL } from './database-url';

/** Applies migrations to the test database once per run. */
export default async function setup() {
  await runMigrations(TEST_DATABASE_URL);
}
