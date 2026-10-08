import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { EXAMPLE_REPORTS } from '@/content/example-reports';
import {
  type AnalysisEngine,
  AnalysisEngineError,
  createAnalysisEngine,
  type EngineJob,
} from '@/server/analysis-engine/client';
import { type AnalysisRow, type NewAnalysisRow } from '@/server/db/schema';
import { type AnalysisRepository } from '@/server/repositories/analysis-repository';
import { createAnalysisService } from '@/server/services/analysis-service';

const report = EXAMPLE_REPORTS['avery-lindqvist']!;
const pdf = readFileSync('tests/fixtures/avery-lindqvist.pdf');

const running = (
  stage: EngineJob['stage'],
  status: 'queued' | 'processing' = 'processing',
): EngineJob => ({ id: 'job-1', status, stage });

describe('analysis engine client', () => {
  it('posts the file and job description with the API key and parses the job', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ id: 'job-1', status: 'queued', stage: 'received' }, { status: 202 }),
    );
    const engine = createAnalysisEngine({ baseUrl: 'https://engine.test/api', apiKey: 'k', fetch });

    const submitted = await engine.submit({
      file: { name: 'cv.pdf', type: 'pdf', bytes: new Uint8Array(pdf) },
      jobDescription: 'React developer',
    });

    expect(submitted).toEqual({ id: 'job-1', status: 'queued', stage: 'received' });
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://engine.test/api/v1/resume-analyses');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer k');
    const form = init?.body as FormData;
    expect((form.get('file') as File).name).toBe('cv.pdf');
    expect((form.get('file') as File).type).toBe('application/pdf');
    expect(form.get('jobDescription')).toBe('React developer');
  });

  it('rejects responses outside the contract', async () => {
    for (const body of [
      { id: 'job-1', status: 'done', stage: 'done' },
      { id: 'job-1', status: 'completed', stage: 'done' },
      { id: 'job-1', status: 'failed', stage: 'extracting' },
    ]) {
      const engine = createAnalysisEngine({
        baseUrl: 'https://engine.test',
        fetch: async () => Response.json(body),
      });
      await expect(engine.get('job-1')).rejects.toBeInstanceOf(AnalysisEngineError);
    }
  });

  it('reports HTTP and network failures as engine errors', async () => {
    const failing = createAnalysisEngine({
      baseUrl: 'https://engine.test',
      fetch: async () => new Response('busy', { status: 503 }),
    });
    await expect(failing.get('job-1')).rejects.toThrow('answered 503');

    const unreachable = createAnalysisEngine({
      baseUrl: 'https://engine.test',
      fetch: async () => {
        throw new TypeError('fetch failed');
      },
    });
    await expect(unreachable.get('job-1')).rejects.toThrow('could not be reached');
  });
});

function harness(engine: AnalysisEngine) {
  const updates: Partial<NewAnalysisRow>[] = [];
  const repository = {
    deleteExpired: async () => {},
    failStale: async () => {},
    insert: async (values: NewAnalysisRow) => ({ id: 'a-1', ...values }) as AnalysisRow,
    update: async (_id: string, values: Partial<NewAnalysisRow>) => {
      updates.push(values);
    },
  } as unknown as AnalysisRepository;
  const service = createAnalysisService({ repository, engine, wait: async () => {} });
  const run = async () => {
    const { run } = await service.submit({
      file: { name: 'avery-lindqvist.pdf', bytes: new Uint8Array(pdf) },
      fields: {},
      ownerHash: 'owner',
    });
    await run();
  };
  return { updates, run };
}

describe('analysis pipeline', () => {
  it('records every stage the engine reports and stores the report', async () => {
    const reads: EngineJob[] = [
      running('extracting'),
      running('parsing'),
      running('scoring'),
      { id: 'job-1', status: 'completed', stage: 'done', report },
    ];
    const { updates, run } = harness({
      submit: async () => running('received', 'queued'),
      get: async () => reads.shift() ?? running('scoring'),
    });

    await run();

    expect(updates.map((update) => update.stage)).toEqual([
      'received',
      'extracting',
      'parsing',
      'scoring',
      'done',
    ]);
    expect(updates[0]).toMatchObject({ status: 'processing', engineJobId: 'job-1' });
    expect(updates.at(-1)).toMatchObject({
      status: 'completed',
      score: report.score,
      engineVersion: report.engineVersion,
    });
  });

  it('keeps the error the engine gives for a document it cannot read', async () => {
    const error = { code: 'no_text_found', message: 'No readable text was found.' };
    const { updates, run } = harness({
      submit: async () => running('received', 'queued'),
      get: async () => ({ id: 'job-1', status: 'failed', stage: 'extracting', error }),
    });

    await run();

    expect(updates.at(-1)).toMatchObject({
      status: 'failed',
      errorCode: 'no_text_found',
      errorMessage: 'No readable text was found.',
    });
  });

  it('retries a status read that fails once and still completes the analysis', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const reads: Array<() => EngineJob> = [
      () => {
        throw new AnalysisEngineError('The analysis engine answered 502.');
      },
      () => ({ id: 'job-1', status: 'completed', stage: 'done', report }),
    ];
    const { updates, run } = harness({
      submit: async () => running('received', 'queued'),
      get: async () => reads.shift()!(),
    });

    await run();

    expect(updates.at(-1)).toMatchObject({ status: 'completed', score: report.score });
  });

  it('gives up after several status reads fail in a row', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const get = vi.fn(async (): Promise<EngineJob> => {
      throw new AnalysisEngineError('The analysis engine could not be reached.');
    });
    const { updates, run } = harness({ submit: async () => running('received', 'queued'), get });

    await run();

    expect(get).toHaveBeenCalledTimes(3);
    expect(updates.at(-1)).toMatchObject({ status: 'failed', errorCode: 'engine_unavailable' });
  });

  it('fails the analysis with a clear message when the engine is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { updates, run } = harness({
      submit: async () => {
        throw new AnalysisEngineError('The analysis engine could not be reached.');
      },
      get: async () => running('extracting'),
    });

    await run();

    expect(updates).toEqual([
      expect.objectContaining({ status: 'failed', errorCode: 'engine_unavailable' }),
    ]);
  });
});
