import type * as NextServer from 'next/server';
import { afterAll, beforeEach, vi } from 'vitest';

import { createDatabase } from '../../src/server/db/client';
import { analyses } from '../../src/server/db/schema';
import { seedDatabase } from '../../src/server/db/seed';
import { TEST_DATABASE_URL } from './database-url';

process.env.DATABASE_URL = TEST_DATABASE_URL;

const background: Promise<unknown>[] = [];

/** `after()` needs a live Next.js request; in tests the deferred work is collected instead. */
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  after: (task: Promise<unknown> | (() => unknown)) => {
    background.push(Promise.resolve(typeof task === 'function' ? task() : task));
  },
}));

/** Waits for every pipeline started by the requests made so far. */
export async function flushBackground() {
  await Promise.all(background.splice(0));
}

const { db, sql } = createDatabase(TEST_DATABASE_URL, { max: 2 });

beforeEach(async () => {
  await db.delete(analyses);
  await seedDatabase(db);
});

afterAll(async () => {
  await sql.end();
});
