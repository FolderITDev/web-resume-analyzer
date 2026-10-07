import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { AxisMeter } from '@/components/specimen/axis-meter';
import { ScoreSpecimen } from '@/components/specimen/score-specimen';
import { ButtonLink, buttonStyles } from '@/components/ui/button';
import { absoluteUrl, siteConfig, siteOrigin } from '@/config/site';
import { EXAMPLE_REPORTS, exampleReport } from '@/content/example-reports';
import { FAQ } from '@/content/faq';
import { PipelineWaterfall } from '@/features/landing/pipeline-waterfall';
import { type SpecimenSkill, SkillsSpecimen } from '@/features/landing/skills-specimen';
import { pageMetadata } from '@/lib/seo/metadata';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  JsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
} from '@/lib/seo/json-ld';

const description =
  'Free resume analyzer: upload a PDF or DOCX and get an explainable score, detected skills, years of experience and a job description match. Built by Folder IT with Next.js, TypeScript and PostgreSQL.';

export const metadata: Metadata = pageMetadata({ path: '/', description });

const SEVERITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' } as const;

const EXAMPLE_DESCRIPTION = 'Example report for a mobile engineer’s resume';

/** Every skill the engine detected across the example reports, once each, by name. */
function exampleSkills(): SpecimenSkill[] {
  const byId = new Map<string, SpecimenSkill>();
  for (const report of Object.values(EXAMPLE_REPORTS)) {
    for (const { id, name, category } of report.skills) byId.set(id, { id, name, category });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const STACK = [
  [
    'Frontend',
    'Next.js App Router, React Server Components, TypeScript, Tailwind CSS, TanStack Query, React Hook Form',
  ],
  [
    'API',
    'REST Route Handlers, Zod validation of every input and output, RFC 9457 errors, OpenAPI 3.1',
  ],
  ['Data', 'PostgreSQL, Drizzle ORM and versioned SQL migrations'],
  [
    'Integration',
    'HTTP client for the analysis engine, every response validated against its Zod contract',
  ],
  [
    'Quality',
    'Strict TypeScript, ESLint, Vitest unit and integration tests, Playwright end-to-end tests, GitHub Actions',
  ],
] as const;

const LAYERS = [
  ['Browser', 'Upload with progress, polling with TanStack Query'],
  ['Next.js', 'Server-rendered landing, client islands for the tool'],
  ['REST API', 'Route Handlers validate and map errors'],
  ['Services', 'Use cases; analysis jobs sent to the engine'],
  ['Repositories', 'Drizzle queries, nothing else'],
  ['PostgreSQL', 'Analyses and reports, never the file'],
] as const;

function SectionHeading({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <h2 id={id} className="text-title font-[460]">
        {title}
      </h2>
      <p className="max-w-[58ch] text-lead text-ink-2">{children}</p>
    </div>
  );
}

export default function LandingPage() {
  const report = exampleReport('diego-marquez');
  const skills = exampleSkills();
  const findings = [...report.strengths, ...report.issues];

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webApplicationJsonLd(),
          breadcrumbJsonLd([
            { name: 'Folder IT', url: siteConfig.company.url },
            { name: 'Apps', url: `${siteOrigin()}/apps` },
            { name: siteConfig.name, url: absoluteUrl('/') },
          ]),
          faqJsonLd(FAQ),
        ]}
      />

      <section aria-labelledby="hero-title" className="mx-auto max-w-[90rem] px-5 sm:px-8">
        <div className="grid gap-14 py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-0 lg:py-20">
          <div className="flex flex-col justify-center gap-8 lg:pr-16">
            <h1
              id="hero-title"
              className="text-[clamp(2.75rem,1.5rem+4.4vw,4.75rem)] leading-[1.02] font-[460] tracking-[-0.035em]"
            >
              Read your resume the way a reviewer does.
            </h1>
            <p className="max-w-[46ch] text-lead text-ink-2">
              Upload a PDF or DOCX and get a scored report in seconds: the skills a reviewer will
              notice, the experience they will count and the changes that matter most. Every finding
              names the check that produced it.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/analyze">
                Analyze a resume
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/analyze?example=senior-engineer" variant="quiet">
                Try an example resume
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3">
              <li>Free, no account</li>
              <li>Every finding explained</li>
              <li>Reports deleted after 24 hours</li>
            </ul>
          </div>

          <div className="grid gap-10 border-rule sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:border-l lg:pl-12">
            <ScoreSpecimen
              score={report.score}
              grade={report.grade}
              size="hero"
              className="sm:min-h-[24rem]"
            />
            <div className="flex flex-col gap-6">
              <p className="readout text-ink-2">Categories</p>
              <div className="flex flex-col gap-5">
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
            </div>
            <p className="text-[0.8125rem] text-ink-3 sm:col-span-2">
              {EXAMPLE_DESCRIPTION}, generated by the analysis engine{' '}
              <span className="font-mono text-[0.75rem]">{report.engineVersion}</span>.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="skills-title" className="border-t border-ink">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-10 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading id="skills-title" title="Skills, recognized by name">
            The report lists the exact names reviewers scan for and how often each appears. These{' '}
            {skills.length} are the ones the analysis engine found across the example resumes.
          </SectionHeading>
          <SkillsSpecimen skills={skills} />
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="pipeline-title" className="bg-surface">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-10 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading id="pipeline-title" title="From file to report in five stages">
            The upload returns immediately and the analysis engine works through the document in the
            background. The page follows each stage as the engine reports it.
          </SectionHeading>
          <PipelineWaterfall />
        </div>
      </section>

      <section id="findings" aria-labelledby="findings-title">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-10 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading id="findings-title" title="Every finding cites its check">
            The score weighs six categories. Each strength, issue and recommendation carries the ID
            of the check that produced it, so a number never appears without its reasons. These are
            the findings behind the example report above.
          </SectionHeading>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-rule py-4">
            {report.categories.map((category) => (
              <div key={category.id} className="flex items-baseline gap-2">
                <dt className="text-sm text-ink-2">{category.label}</dt>
                <dd className="readout text-ink">{Math.round(category.weight * 100)}%</dd>
              </div>
            ))}
          </dl>

          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Example report findings table"
          >
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <caption className="sr-only">Findings of the example report</caption>
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="py-3 pr-6 readout font-normal text-ink-2">
                    Check
                  </th>
                  <th scope="col" className="py-3 pr-6 readout font-normal text-ink-2">
                    Category
                  </th>
                  <th scope="col" className="py-3 pr-6 readout font-normal text-ink-2">
                    Severity
                  </th>
                  <th scope="col" className="py-3 readout font-normal text-ink-2">
                    Finding
                  </th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding) => (
                  <tr key={`${finding.ruleId}:${finding.title}`} className="border-b border-rule">
                    <td className="py-3.5 pr-6 font-mono text-sm whitespace-nowrap">
                      {finding.ruleId}
                    </td>
                    <td className="py-3.5 pr-6 text-[0.9375rem] capitalize">{finding.category}</td>
                    <td className="py-3.5 pr-6 text-[0.9375rem] text-ink-2">
                      {SEVERITY_LABEL[finding.severity]}
                    </td>
                    <td className="py-3.5 text-[0.9375rem]">{finding.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="built-by-title" className="border-t border-ink">
        <div className="mx-auto grid max-w-[90rem] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-28">
          <div className="flex flex-col gap-6">
            <h2 id="built-by-title" className="text-title font-[460]">
              Built by Folder IT
            </h2>
            <div className="flex max-w-[60ch] flex-col gap-4 text-lead text-ink-2">
              <p>
                <a
                  href={siteConfig.company.url}
                  className="text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
                >
                  Folder IT
                </a>{' '}
                is a nearshore software development company that builds custom web and mobile
                applications, business platforms and AI-ready engineering teams for U.S. companies.
              </p>
              <p>
                The team builds and maintains Resume Analyzer the way it builds client software: a
                typed REST API with an OpenAPI contract, asynchronous jobs on an external analysis
                engine, PostgreSQL persistence with migrations, careful loading, empty and error
                states, and tests at every layer.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={siteConfig.repositoryUrl} className={buttonStyles({ variant: 'secondary' })}>
                View the source code
                <ArrowUpRight aria-hidden />
              </a>
              <ButtonLink href="/docs/api" variant="quiet">
                Read the API reference
                <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-[600]">Architecture</h3>
              <ol className="flex flex-col">
                {LAYERS.map(([layer, note], index) => (
                  <li
                    key={layer}
                    className="relative flex flex-col gap-0.5 border-l border-rule-strong py-2.5 pl-5"
                  >
                    <span
                      aria-hidden
                      className="absolute top-[1.15rem] -left-[4px] size-[7px] rounded-full border border-ink bg-paper"
                    />
                    <span className="font-[560]" style={{ fontWeight: 420 + index * 60 }}>
                      {layer}
                    </span>
                    <span className="text-sm text-ink-3">{note}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-[600]">Technologies</h3>
              <dl className="flex flex-col divide-y divide-rule border-y border-rule">
                {STACK.map(([area, items]) => (
                  <div key={area} className="flex flex-col gap-1 py-3">
                    <dt className="readout text-ink-2">{area}</dt>
                    <dd className="text-[0.9375rem] leading-relaxed">{items}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="bg-surface">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:py-28">
          <h2 id="faq-title" className="text-title font-[460]">
            Questions
          </h2>
          <div className="border-t border-ink">
            {FAQ.map((item) => (
              <details key={item.question} className="group border-b border-rule">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-[540] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden
                    className="relative size-3 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-ink after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-ink after:transition-transform after:duration-200 after:ease-(--ease-out) group-open:after:scale-y-0"
                  />
                </summary>
                <p className="max-w-[68ch] pb-6 leading-relaxed text-ink-2">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="close-title" className="border-t border-ink">
        <div className="mx-auto flex max-w-[90rem] flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <h2
            id="close-title"
            className="max-w-[18ch] text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1.04] font-[460] tracking-[-0.03em]"
          >
            Your report is ready in seconds.
          </h2>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/analyze">
              Analyze a resume
              <ArrowRight aria-hidden />
            </ButtonLink>
            <Link
              href="/analyses"
              className="inline-flex h-11 items-center px-3 text-[0.9375rem] text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink"
            >
              Browse example reports
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
