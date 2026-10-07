const STAGES = [
  {
    name: 'Received',
    weight: 240,
    detail:
      'The upload is checked from its bytes: a real PDF or DOCX, at most 5 MB. A row is recorded, the file goes to the analysis engine as a job and the API answers 202 Accepted.',
  },
  {
    name: 'Extracting',
    weight: 380,
    detail:
      'The engine reads the text of the document. The file itself is never written to the application\u2019s disk or database.',
  },
  {
    name: 'Parsing',
    weight: 520,
    detail:
      'Headings become sections, bullets become achievements, and date ranges become merged, non-overlapping years of experience.',
  },
  {
    name: 'Matching',
    weight: 660,
    detail:
      'With a job description, its skills and distinctive terms are compared with the resume. Without one, the engine skips this stage.',
  },
  {
    name: 'Scoring',
    weight: 800,
    detail:
      'Six weighted categories are scored. Each strength, issue and recommendation keeps the ID of the check that produced it.',
  },
] as const;

/**
 * The engine's pipeline set as a specimen waterfall: each stage gains weight as the analysis
 * takes shape.
 */
export function PipelineWaterfall() {
  return (
    <ol className="border-t border-ink">
      {STAGES.map((stage, index) => (
        <li
          key={stage.name}
          className="grid gap-x-10 gap-y-2 border-b border-rule py-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-baseline"
        >
          <p
            className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] leading-none tracking-[-0.03em]"
            style={{ fontWeight: stage.weight }}
          >
            {stage.name}
          </p>
          <p className="max-w-[56ch] text-[0.9375rem] leading-relaxed text-ink-2">{stage.detail}</p>
          <p aria-hidden className="readout text-ink-3 md:text-right">
            {String(index + 1).padStart(2, '0')} · wght {stage.weight}
          </p>
        </li>
      ))}
    </ol>
  );
}
