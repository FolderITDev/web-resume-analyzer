import { createDatabase } from '../src/server/db/client';
import { seedDatabase } from '../src/server/db/seed';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');

const { db, sql } = createDatabase(url, { max: 1 });
try {
  const count = await seedDatabase(db);
  console.log(`Seeded ${count} example analyses.`);
} finally {
  await sql.end();
}
