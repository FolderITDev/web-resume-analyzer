import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';
import { type Analysis, type AnalysisStage } from '@/lib/validation/analysis';

type PipelineStage = { id: Exclude<AnalysisStage, 'done'>; label: string; detail: string };

const STAGES: readonly PipelineStage[] = [
  { id: 'received', label: 'Received', detail: 'File checked and sent to the engine' },
  { id: 'extracting', label: 'Extracting', detail: 'Reading the document text' },
  { id: 'parsing', label: 'Parsing', detail: 'Sections, bullets and dates' },
  { id: 'matching', label: 'Matching', detail: 'Comparing with the job description' },
  { id: 'scoring', label: 'Scoring', detail: 'Scoring six categories' },
];

/** The stages an analysis goes through; matching only runs when a job description was given. */
export function pipelineStages(hasJobDescription: boolean): readonly PipelineStage[] {
  return STAGES.filter((stage) => stage.id !== 'matching' || hasJobDescription);
}

/**
 * The pipeline as a waterfall that gains weight as stages complete. The current stage is
 * announced politely; finished stages keep a check so progress never relies on weight alone.
 */
export function AnalysisProgress({
  analysis,
  stage,
}: {
  analysis: Analysis;
  stage: AnalysisStage;
}) {
  const stages = pipelineStages(analysis.hasJobDescription);
  const currentIndex = stages.findIndex((item) => item.id === stage);
  const current = stages[currentIndex];

  return (
    <section aria-labelledby="progress-title" className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 id="progress-title" className="text-title font-[460]">
          Analyzing {analysis.file.name}
        </h1>
        <p className="text-lead text-ink-2" aria-live="polite">
          {current
            ? `${current.label}: ${current.detail.toLowerCase()}.`
            : 'Waiting for the analysis engine to start.'}
        </p>
      </div>

      <ol className="border-t border-ink">
        {stages.map((item, index) => {
          const state =
            index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending';
          return (
            <li
              key={item.id}
              aria-current={state === 'current' ? 'step' : undefined}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-5"
            >
              <span aria-hidden className="flex size-5 items-center justify-center self-center">
                {state === 'done' ? (
                  <Check className="size-4 text-ink" strokeWidth={2} />
                ) : state === 'current' ? (
                  <span className="size-2.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
                ) : (
                  <span className="size-1.5 rounded-full bg-rule-strong" />
                )}
              </span>
              <span
                className={cn(
                  'text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-none tracking-[-0.025em] transition-[font-weight,color] duration-500 ease-(--ease-out)',
                  state === 'done' && 'font-[480] text-ink-2',
                  state === 'current' && 'font-[700] text-ink',
                  state === 'pending' && 'font-[260] text-ink-3',
                )}
              >
                {item.label}
                <span className="sr-only">
                  {state === 'done'
                    ? ', done'
                    : state === 'current'
                      ? ', in progress'
                      : ', pending'}
                </span>
              </span>
              <span className="hidden text-sm text-ink-3 sm:block">{item.detail}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
