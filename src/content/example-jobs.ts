/** Example job postings, paired with the example resumes and used by the tests. */
export const EXAMPLE_JOB_DESCRIPTIONS = {
  'senior-full-stack': {
    title: 'Senior Full-Stack Engineer',
    text: `Senior Full-Stack Engineer — Larkspur Payments

We are looking for a senior engineer to build the merchant dashboard and the APIs behind it.

What you will do
- Build product features end to end with TypeScript, React and Next.js.
- Design REST APIs and data models on Node.js and PostgreSQL.
- Own reliability: monitoring, alerting and on-call for the services you ship.
- Improve performance of dashboards that render thousands of transactions.
- Review code and mentor engineers on the team.

Requirements
- 5+ years building web applications in production.
- Strong TypeScript, React and Node.js.
- PostgreSQL and data modeling experience.
- Experience with Docker, CI/CD and AWS.
- Automated testing with Playwright or Cypress, plus unit tests.
- Nice to have: GraphQL, Redis, Kubernetes, accessibility expertise.`,
  },
  'frontend-developer': {
    title: 'Frontend Developer',
    text: `Frontend Developer — Brightpath Health Systems

Join the patient portal team to build accessible, fast interfaces used by clinics every day.

Responsibilities
- Develop React components in our design system with Storybook.
- Implement responsive layouts with Tailwind CSS.
- Write unit tests with Vitest and Testing Library.
- Partner with designers in Figma and ship accessible features that meet WCAG 2.2.
- Measure and improve Core Web Vitals.

Requirements
- 2+ years with React and TypeScript.
- Solid HTML, CSS and accessibility fundamentals.
- Experience consuming REST APIs and managing server state with TanStack Query.
- Git and code review experience in an Agile team.`,
  },
  'data-engineer': {
    title: 'Data Engineer',
    text: `Data Engineer — Tidewater Analytics

You will design and maintain the pipelines that feed our forecasting platform.

Responsibilities
- Build batch and streaming pipelines with Python, Spark and Kafka.
- Orchestrate workflows with Airflow and model data with dbt.
- Operate PostgreSQL and warehouse workloads on Google Cloud.
- Monitor data quality and pipeline health.

Requirements
- 3+ years in data engineering.
- Python, SQL and Apache Spark.
- Experience with Airflow, Docker and Terraform.
- Comfortable with Linux, Git and CI/CD.`,
  },
} satisfies Record<string, { title: string; text: string }>;

export type ExampleJobSlug = keyof typeof EXAMPLE_JOB_DESCRIPTIONS;
