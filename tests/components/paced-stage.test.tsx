import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rememberSubmission, usePacedStage } from '@/features/resumes/use-paced-stage';
import { type Analysis } from '@/lib/validation/analysis';

function analysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: crypto.randomUUID(),
    status: 'queued',
    stage: 'received',
    file: { name: 'resume.pdf', type: 'pdf', sizeBytes: 2048 },
    jobTitle: null,
    hasJobDescription: false,
    isExample: false,
    createdAt: '2026-10-07T12:00:00.000Z',
    completedAt: null,
    report: null,
    error: null,
    ...overrides,
  };
}

describe('usePacedStage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an analysis opened from a link as it is, without replaying the pipeline', () => {
    const { result } = renderHook(() => usePacedStage(analysis({ status: 'completed' })));
    expect(result.current).toEqual({ kind: 'result' });
  });

  it('replays the stages of a fresh upload one at a time before the result', () => {
    const done = analysis({ status: 'completed', stage: 'done' });
    rememberSubmission(done.id);
    const { result } = renderHook(() => usePacedStage(done));

    const seen = [result.current];
    for (let step = 0; step < 4; step += 1) {
      act(() => {
        vi.advanceTimersByTime(450);
      });
      seen.push(result.current);
    }

    expect(seen).toEqual([
      { kind: 'progress', stage: 'received' },
      { kind: 'progress', stage: 'extracting' },
      { kind: 'progress', stage: 'parsing' },
      { kind: 'progress', stage: 'scoring' },
      { kind: 'result' },
    ]);
  });

  it('never runs ahead of the server', () => {
    const running = analysis({ status: 'processing', stage: 'extracting' });
    rememberSubmission(running.id);
    const { result } = renderHook(() => usePacedStage(running));

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current).toEqual({ kind: 'progress', stage: 'extracting' });
  });

  it('reports a failure at once', () => {
    const failed = analysis({ status: 'failed', stage: 'extracting' });
    rememberSubmission(failed.id);
    const { result } = renderHook(() => usePacedStage(failed));
    expect(result.current).toEqual({ kind: 'result' });
  });
});
