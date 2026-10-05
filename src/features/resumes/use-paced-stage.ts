'use client';

import { useEffect, useState } from 'react';

import { type Analysis, type AnalysisStage } from '@/lib/validation/analysis';

import { pipelineStages } from './components/analysis-progress';

/** How long each stage stays on screen at least, so the progress can be read. */
const MIN_STAGE_MS = 450;

/** Analyses uploaded from this tab. Only these replay their pipeline; others open at once. */
const submittedHere = new Set<string>();

export function rememberSubmission(id: string): void {
  submittedHere.add(id);
}

export type PacedView = { kind: 'progress'; stage: AnalysisStage } | { kind: 'result' };

/**
 * The pipeline usually finishes faster than a person can read it. After an upload, stages are
 * revealed one at a time, each for at least MIN_STAGE_MS and never ahead of the server, before
 * the report appears. Failures are shown as soon as they are known, and an analysis opened
 * from the history or a link shows its result directly.
 */
export function usePacedStage(analysis: Analysis): PacedView {
  const [paced] = useState(() => submittedHere.has(analysis.id));
  const [revealed, setRevealed] = useState(0);

  const stages = pipelineStages(analysis.hasJobDescription);
  const serverIndex = stages.findIndex((stage) => stage.id === analysis.stage);
  const target = analysis.status === 'completed' ? stages.length : Math.max(0, serverIndex);

  useEffect(() => {
    if (!paced || revealed >= target) return;
    const timer = setTimeout(() => setRevealed((count) => count + 1), MIN_STAGE_MS);
    return () => clearTimeout(timer);
  }, [paced, revealed, target]);

  if (analysis.status === 'failed') return { kind: 'result' };
  if (!paced) {
    return analysis.status === 'completed'
      ? { kind: 'result' }
      : { kind: 'progress', stage: analysis.stage };
  }
  const shown = stages[revealed];
  return shown ? { kind: 'progress', stage: shown.id } : { kind: 'result' };
}
