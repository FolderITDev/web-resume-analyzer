import { and, asc, count, desc, eq, ilike, isNotNull, lt, or, type SQL, sql } from 'drizzle-orm';

import { type ListAnalysesQuery } from '@/lib/validation/analysis';

import { type Database } from '../db/client';
import { type AnalysisRow, analyses, type NewAnalysisRow } from '../db/schema';

/** Rows the visitor may see: every example plus their own analyses. */
function visibleTo(ownerHash: string | null): SQL {
  return ownerHash
    ? or(eq(analyses.isExample, true), eq(analyses.ownerHash, ownerHash))!
    : eq(analyses.isExample, true);
}

const ORDER_BY = {
  newest: [desc(analyses.createdAt), desc(analyses.id)],
  oldest: [asc(analyses.createdAt), asc(analyses.id)],
  'score-desc': [sql`${analyses.score} DESC NULLS LAST`, desc(analyses.createdAt)],
  'score-asc': [sql`${analyses.score} ASC NULLS LAST`, desc(analyses.createdAt)],
} as const;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Data access for analyses. Knows SQL, knows nothing about HTTP or business rules. */
export function createAnalysisRepository(db: Database) {
  return {
    async insert(values: NewAnalysisRow): Promise<AnalysisRow> {
      const [row] = await db.insert(analyses).values(values).returning();
      if (!row) throw new Error('Insert returned no row.');
      return row;
    },

    async update(id: string, values: Partial<NewAnalysisRow>): Promise<void> {
      await db.update(analyses).set(values).where(eq(analyses.id, id));
    },

    async findVisible(id: string, ownerHash: string | null): Promise<AnalysisRow | undefined> {
      const [row] = await db
        .select()
        .from(analyses)
        .where(and(eq(analyses.id, id), visibleTo(ownerHash)))
        .limit(1);
      return row;
    },

    async list(
      query: ListAnalysesQuery,
      ownerHash: string | null,
    ): Promise<{ rows: AnalysisRow[]; total: number }> {
      const filters = [visibleTo(ownerHash)];
      if (query.status) filters.push(eq(analyses.status, query.status));
      if (query.q) {
        const pattern = `%${escapeLike(query.q)}%`;
        filters.push(or(ilike(analyses.fileName, pattern), ilike(analyses.jobTitle, pattern))!);
      }
      const where = and(...filters);

      const [rows, [totals]] = await Promise.all([
        db
          .select()
          .from(analyses)
          .where(where)
          .orderBy(...ORDER_BY[query.sort])
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        db.select({ total: count() }).from(analyses).where(where),
      ]);
      return { rows, total: totals?.total ?? 0 };
    },

    async deleteOwned(id: string, ownerHash: string): Promise<boolean> {
      const deleted = await db
        .delete(analyses)
        .where(and(eq(analyses.id, id), eq(analyses.ownerHash, ownerHash)))
        .returning({ id: analyses.id });
      return deleted.length > 0;
    },

    /** Visitor analyses expire; examples are permanent. */
    async deleteExpired(olderThan: Date): Promise<number> {
      const deleted = await db
        .delete(analyses)
        .where(and(isNotNull(analyses.ownerHash), lt(analyses.createdAt, olderThan)))
        .returning({ id: analyses.id });
      return deleted.length;
    },

    /** Jobs interrupted by a restart would otherwise poll forever. */
    async failStale(createdBefore: Date, failedAt: Date): Promise<void> {
      await db
        .update(analyses)
        .set({
          status: 'failed',
          errorCode: 'processing_interrupted',
          errorMessage: 'Processing was interrupted. Upload the file again.',
          completedAt: failedAt,
        })
        .where(
          and(
            or(eq(analyses.status, 'queued'), eq(analyses.status, 'processing')),
            lt(analyses.createdAt, createdBefore),
          ),
        );
    },
  };
}

export type AnalysisRepository = ReturnType<typeof createAnalysisRepository>;
