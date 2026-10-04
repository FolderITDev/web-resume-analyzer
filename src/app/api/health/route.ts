import { sql } from 'drizzle-orm';
import { connection } from 'next/server';

import { db } from '@/server/db';

/** Liveness and database readiness, for container orchestration and uptime checks. */
export async function GET() {
  await connection();
  try {
    await db().execute(sql`select 1`);
    return Response.json(
      { status: 'ok', database: 'ok' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { status: 'degraded', database: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
