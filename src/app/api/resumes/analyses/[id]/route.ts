import { AnalysisSchema } from '@/lib/validation/analysis';
import { handle, json } from '@/server/http/responses';
import { readSession } from '@/server/http/session';
import { analysisService } from '@/server/services';

type Context = RouteContext<'/api/resumes/analyses/[id]'>;

/** Returns one analysis. Clients poll this until status is "completed" or "failed". */
export const GET = handle<Context>(async (request, { params }) => {
  const { id } = await params;
  const analysis = await analysisService().get(id, readSession(request));
  return json(AnalysisSchema, analysis, { headers: { 'Cache-Control': 'private, no-store' } });
});

/** Deletes one of the visitor's own analyses. Examples cannot be deleted. */
export const DELETE = handle<Context>(async (request, { params }) => {
  const { id } = await params;
  await analysisService().remove(id, readSession(request));
  return new Response(null, { status: 204 });
});
