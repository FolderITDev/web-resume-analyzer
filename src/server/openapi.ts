import { z } from 'zod';

import { absoluteUrl, siteConfig } from '@/config/site';
import {
  AnalysisListSchema,
  AnalysisSchema,
  AnalysisStatusSchema,
  JOB_DESCRIPTION_MAX_LENGTH,
  ProblemSchema,
  SubmittedAnalysisSchema,
} from '@/lib/validation/analysis';

const ref = (schema: z.ZodType) => {
  const id = z.globalRegistry.get(schema)?.id;
  if (!id) throw new Error('Schemas referenced in the OpenAPI document need a meta id.');
  return { $ref: `#/components/schemas/${id}` };
};

const problem = (description: string) => ({
  description,
  content: { 'application/problem+json': { schema: ref(ProblemSchema) } },
});

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

/**
 * OpenAPI 3.1 document built from the Zod contracts. Components come straight from the schemas
 * the handlers validate with, so the documentation cannot describe a shape the API does not send.
 */
export function openApiDocument() {
  const { schemas } = z.toJSONSchema(z.globalRegistry, {
    uri: (id) => `#/components/schemas/${id}`,
    unrepresentable: 'any',
  });

  return {
    openapi: '3.1.0',
    info: {
      title: `${siteConfig.name} API`,
      version: '1.0.0',
      description:
        'REST API of Resume Analyzer, built by Folder IT. Uploads are handed to the analysis engine as asynchronous jobs; poll an analysis until it is completed or failed.',
      contact: { name: siteConfig.company.name, url: siteConfig.company.url },
      license: { name: 'MIT', identifier: 'MIT' },
    },
    externalDocs: { description: 'Source code', url: siteConfig.repositoryUrl },
    servers: [{ url: absoluteUrl('/api') }],
    tags: [{ name: 'Analyses', description: 'Upload resumes and read their reports.' }],
    paths: {
      '/resumes/analyze': {
        post: {
          tags: ['Analyses'],
          operationId: 'analyzeResume',
          summary: 'Upload a resume for analysis',
          description:
            'Accepts a PDF or DOCX file up to 5 MB and an optional job description. Responds 202 immediately; poll the Location URL until the status is completed or failed.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'PDF or DOCX, at most 5 MB.',
                    },
                    jobTitle: { type: 'string', maxLength: 120 },
                    jobDescription: { type: 'string', maxLength: JOB_DESCRIPTION_MAX_LENGTH },
                  },
                },
              },
            },
          },
          responses: {
            '202': {
              description: 'Accepted and queued.',
              headers: {
                Location: {
                  schema: { type: 'string' },
                  description: 'URL of the analysis to poll.',
                },
              },
              content: { 'application/json': { schema: ref(SubmittedAnalysisSchema) } },
            },
            '413': problem('The file is larger than 5 MB.'),
            '415': problem(
              'The file is not a PDF or DOCX, or its content does not match its extension.',
            ),
            '422': problem('A field is missing or invalid.'),
            '429': problem('Too many uploads from this client.'),
          },
        },
      },
      '/resumes/analyses': {
        get: {
          tags: ['Analyses'],
          operationId: 'listAnalyses',
          summary: 'List analyses',
          description:
            'Returns the example analyses plus the ones uploaded from the calling browser session.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: AnalysisStatusSchema.options },
            },
            {
              name: 'q',
              in: 'query',
              description: 'Search by file name or job title.',
              schema: { type: 'string', maxLength: 80 },
            },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['newest', 'oldest', 'score-desc', 'score-asc'],
                default: 'newest',
              },
            },
          ],
          responses: {
            '200': {
              description: 'A page of analyses.',
              content: { 'application/json': { schema: ref(AnalysisListSchema) } },
            },
            '422': problem('A query parameter is invalid.'),
          },
        },
      },
      '/resumes/analyses/{id}': {
        get: {
          tags: ['Analyses'],
          operationId: 'getAnalysis',
          summary: 'Get an analysis',
          parameters: [idParameter],
          responses: {
            '200': {
              description: 'The analysis, with its report once completed.',
              content: { 'application/json': { schema: ref(AnalysisSchema) } },
            },
            '404': problem('No visible analysis with this ID.'),
          },
        },
        delete: {
          tags: ['Analyses'],
          operationId: 'deleteAnalysis',
          summary: 'Delete one of your analyses',
          parameters: [idParameter],
          responses: {
            '204': { description: 'Deleted.' },
            '403': problem('Example reports cannot be deleted.'),
            '404': problem('No visible analysis with this ID.'),
          },
        },
      },
    },
    components: { schemas },
  };
}
