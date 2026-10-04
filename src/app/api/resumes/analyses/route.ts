import { AnalysisListSchema, ListAnalysesQuerySchema } from '@/lib/validation/analysis';
import { handle, json } from '@/server/http/responses';
import { readSession } from '@/server/http/session';
import { analysisService } from '@/server/services';

/** Lists the example analyses plus the visitor's own, with search, filters and paging. */
export const GET = handle(async (request) => {
  const query = ListAnalysesQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const list = await analysisService().list(query, readSession(request));
  return json(AnalysisListSchema, list, { headers: { 'Cache-Control': 'private, no-store' } });
});
