import 'server-only';

import { env } from '../env';
import { createDatabase, type Database } from './client';

const globalForDb = globalThis as unknown as { resumeAnalyzerDb?: Database };

/** Shared pool for the Next.js server. Reused across hot reloads in development. */
export function db(): Database {
  globalForDb.resumeAnalyzerDb ??= createDatabase(env().DATABASE_URL).db;
  return globalForDb.resumeAnalyzerDb;
}
