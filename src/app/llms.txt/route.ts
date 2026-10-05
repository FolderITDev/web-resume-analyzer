import { absoluteUrl, siteConfig } from '@/config/site';
import { RULES } from '@/domain/analysis/rules';

/**
 * A plain-text summary for language models and AI search (llmstxt.org): what the application
 * is, who built it, how it works and where its documentation lives.
 */
export function GET() {
  const rules = RULES.map(
    (rule) => `- ${rule.id} (${rule.category}, ${rule.severity}): ${rule.summary}`,
  ).join('\n');
  const body = `# ${siteConfig.name}

> ${siteConfig.shortDescription} Built and maintained by ${siteConfig.company.name} (${siteConfig.company.url}).

${siteConfig.name} is a full-stack web application built with Next.js (App Router), React, strict TypeScript, PostgreSQL and Drizzle ORM. It accepts PDF and DOCX resumes, extracts their text in memory and scores them with a deterministic rules engine; no language model is involved. Uploads are processed asynchronously: the API responds 202 Accepted and clients poll for the report.

${siteConfig.company.description}

## Pages

- [Home](${absoluteUrl('/')}): what the analyzer does, its pipeline, its rules and an FAQ
- [API reference](${absoluteUrl('/docs/api')}): REST endpoints, parameters and responses
- [OpenAPI 3.1 document](${absoluteUrl('/api/openapi.json')})
- [Source code](${siteConfig.repositoryUrl}): MIT licensed

## Scoring rules

${rules}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
