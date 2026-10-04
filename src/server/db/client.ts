import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>['db'];

/** Creates a connection pool and its Drizzle instance. Scripts and tests own their lifecycle. */
export function createDatabase(url: string, options: { max?: number } = {}) {
  const sql = postgres(url, { max: options.max ?? 10, onnotice: () => {} });
  return { sql, db: drizzle(sql, { schema }) };
}
