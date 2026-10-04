import { runMigrations } from '../src/server/db/migrate';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');

await runMigrations(url);
console.log('Migrations applied.');
