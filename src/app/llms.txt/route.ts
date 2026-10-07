import { absoluteUrl, siteConfig } from '@/config/site';

/**
 * A plain-text summary for language models and AI search (llmstxt.org): what the application
 * is, who built it, how it works and where its documentation lives.
 */
export function GET() {
  const body = `# ${siteConfig.name}

> ${siteConfig.shortDescription} Built and maintained by ${siteConfig.company.name} (${siteConfig.company.url}).

${siteConfig.name} is a full-stack web application built with Next.js (App Router), React, strict TypeScript, PostgreSQL and Drizzle ORM. It accepts PDF and DOCX resumes, verifies them from their bytes and hands them to an analysis engine as asynchronous jobs, recording each stage the engine reports. The API responds 202 Accepted and clients poll for the report: an overall score, six weighted categories, detected skills, estimated experience, strengths, issues and recommendations, each citing the check that produced it, plus a job description match when one is provided.

${siteConfig.company.description}

## Pages

- [Home](${absoluteUrl('/')}): what the analyzer does, its pipeline, an example report and an FAQ
- [API reference](${absoluteUrl('/docs/api')}): REST endpoints, parameters and responses
- [OpenAPI 3.1 document](${absoluteUrl('/api/openapi.json')})
- [Source code](${siteConfig.repositoryUrl}): MIT licensed
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
