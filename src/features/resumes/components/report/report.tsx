import { Check, Minus } from 'lucide-react';
import { type ReactNode } from 'react';

import { AxisMeter } from '@/components/specimen/axis-meter';
import { ScoreSpecimen } from '@/components/specimen/score-specimen';
import { formatYears } from '@/lib/format';
import { type AnalysisReport, type SectionId } from '@/lib/validation/analysis';

import { FindingList, RecommendationList } from './findings';
import { SkillsGrid } from './skills-grid';

const SECTION_LABEL: Record<SectionId, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
};

function Block({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-ink pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id={id} className="text-heading font-[540]">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Readout({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-rule py-3.5">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="text-[1.375rem] leading-none font-[520] tracking-[-0.01em] tabular">
        {value}
      </dd>
    </div>
  );
}

export function Report({ report }: { report: AnalysisReport }) {
  const { experience, stats, jobMatch } = report;
  const pct = (part: number, whole: number) =>
    whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`;

  return (
    <div className="flex flex-col gap-16">
      <section
        aria-label="Score"
        className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
      >
        <div className="flex flex-col gap-6">
          <ScoreSpecimen score={report.score} grade={report.grade} />
          <p className="max-w-[52ch] text-lead text-ink-2">{report.summary}</p>
        </div>
        <div className="grid content-start gap-x-10 gap-y-6 sm:grid-cols-2">
          {report.categories.map((category, index) => (
            <AxisMeter
              key={category.id}
              label={category.label}
              value={category.score}
              detail={`Weight ${Math.round(category.weight * 100)}%`}
              index={index}
            />
          ))}
        </div>
      </section>

      {jobMatch ? (
        <Block
          id="job-match-title"
          title="Match with the job description"
          aside={<span className="readout text-ink-2">Match {jobMatch.score} / 100</span>}
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <AxisMeter
                label="Match score"
                value={jobMatch.score}
                detail="Skills 70% · keywords 30%"
              />
              <AxisMeter
                label="Keyword coverage"
                value={Math.round(jobMatch.keywordCoverage * 100)}
                detail="Distinctive terms of the posting found in the resume"
                index={1}
              />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-[1.0625rem] font-[580]">
                Terms from the posting that do not appear
              </h3>
              {jobMatch.missingKeywords.length === 0 ? (
                <p className="text-ink-2">
                  Every distinctive term of the posting appears in the resume.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {jobMatch.missingKeywords.map((keyword) => (
                    <li
                      key={keyword}
                      className="rounded-xs border border-rule-strong px-2.5 py-1 font-mono text-[0.8125rem]"
                    >
                      {keyword}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-ink-3">
                Add a term only if it describes work you have actually done.
              </p>
            </div>
          </div>
        </Block>
      ) : null}

      <Block
        id="recommendations-title"
        title="What to change first"
        aside={
          <span className="readout text-ink-2">
            {report.recommendations.length} recommendations
          </span>
        }
      >
        <RecommendationList items={report.recommendations} />
      </Block>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
        <FindingList
          title="Strengths"
          findings={report.strengths}
          kind="strength"
          empty="No clear strengths yet. Start with the recommendations above."
        />
        <FindingList
          title="Issues"
          findings={report.issues}
          kind="issue"
          empty="No issues found."
        />
      </div>

      <Block
        id="skills-title"
        title="Skills a reviewer will see"
        aside={<span className="readout text-ink-2">{report.skills.length} detected</span>}
      >
        <SkillsGrid skills={report.skills} jobMatch={jobMatch} />
      </Block>

      <Block id="document-title" title="Experience and document">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <dl className="grid gap-x-10 sm:grid-cols-2">
            <Readout label="Estimated experience" value={formatYears(experience.estimatedYears)} />
            <Readout label="Dated roles" value={experience.datedRoles} />
            <Readout label="Earliest dated role" value={experience.earliestYear ?? '—'} />
            <Readout label="Current role" value={experience.hasCurrentRole ? 'Yes' : 'No'} />
            <Readout label="Words" value={stats.wordCount.toLocaleString('en-US')} />
            <Readout label="Bullets" value={stats.bulletCount} />
            <Readout
              label="Bullets with a number"
              value={pct(stats.quantifiedBullets, stats.bulletCount)}
            />
            <Readout
              label="Bullets led by a verb"
              value={pct(stats.actionVerbBullets, stats.bulletCount)}
            />
          </dl>
          <div className="flex flex-col gap-3">
            <h3 className="text-[1.0625rem] font-[580]">Sections found</h3>
            <ul className="flex flex-col">
              {report.sections.map((section) => (
                <li
                  key={section.id}
                  className="flex items-center gap-3 border-b border-rule py-2.5"
                >
                  {section.present ? (
                    <Check aria-hidden className="size-4 text-ink" strokeWidth={2} />
                  ) : (
                    <Minus aria-hidden className="size-4 text-ink-3" />
                  )}
                  <span className={section.present ? 'text-ink' : 'text-ink-3'}>
                    {SECTION_LABEL[section.id]}
                  </span>
                  <span className="sr-only">{section.present ? 'found' : 'not found'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      <p className="readout text-ink-3">Analysis engine {report.engineVersion}</p>
    </div>
  );
}
