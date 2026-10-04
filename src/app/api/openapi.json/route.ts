import { openApiDocument } from '@/server/openapi';

/** The OpenAPI 3.1 description of this API, generated from the same Zod schemas it validates with. */
export function GET() {
  return Response.json(openApiDocument(), { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
