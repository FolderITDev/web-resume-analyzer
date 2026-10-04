import { type ExampleJobSlug } from './example-jobs';

/**
 * Example resumes: the read-only example reports in the history, the downloadable example files
 * and the test fixtures are all built from these texts. Contact details use folderit.net.
 */

export type ExampleResume = {
  slug: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  jobTitle?: string;
  jobDescriptionSlug?: ExampleJobSlug;
  text: string;
};

export const EXAMPLE_RESUMES: readonly ExampleResume[] = [
  {
    slug: 'avery-lindqvist',
    fileName: 'avery-lindqvist-resume.pdf',
    fileType: 'pdf',
    jobTitle: 'Senior Full-Stack Engineer',
    jobDescriptionSlug: 'senior-full-stack',
    text: `Avery Lindqvist
Senior Full-Stack Engineer · Portland, OR
avery.lindqvist@folderit.net · https://avery.folderit.net

Summary
Full-stack engineer with eight years of experience building B2B web platforms with TypeScript, React and Node.js. I focus on reliable APIs, fast interfaces and teams that ship every week.

Experience
Senior Software Engineer — Halcyon Freight Co.
Mar 2021 – Present
• Led the rebuild of the shipment tracking dashboard in Next.js, cutting median load time from 4.2 s to 1.1 s.
• Designed REST APIs on Node.js and PostgreSQL that serve 12 million requests per day at 99.95% availability.
• Introduced Playwright end-to-end tests and GitHub Actions pipelines, reducing production incidents by 38%.
• Mentored 5 engineers and established a weekly code review practice across 3 teams.
• Migrated 40 services from EC2 to Docker containers on AWS ECS, saving $180k per year.

Software Engineer — Quillmark Labs
Jun 2018 – Feb 2021
• Built a React and Redux document editor used by 30,000 monthly active users.
• Implemented GraphQL APIs with Apollo and Redis caching that reduced p95 latency by 60%.
• Responsible for the billing integration with the payments provider.
• Wrote unit tests with Jest, raising coverage from 45% to 82%.

Junior Developer — Ostrander Retail Group
Jan 2016 – May 2018
• Developed internal tools in JavaScript and PHP for 14 regional stores.
• Automated weekly inventory reports, saving the operations team 6 hours per week.

Skills
Languages: TypeScript, JavaScript, SQL, Python
Frontend: React, Next.js, Redux, Tailwind CSS, accessibility (WCAG)
Backend: Node.js, Express, REST APIs, GraphQL
Data: PostgreSQL, Redis, Prisma
Cloud and delivery: AWS, Docker, GitHub Actions, Terraform
Testing: Playwright, Jest, Vitest

Education
B.S. Computer Science — Meridian Grove University, 2015

Projects
Open-source maintainer of a small form validation library with 1,200 stars.`,
  },
  {
    slug: 'jordan-okafor',
    fileName: 'jordan-okafor-cv.docx',
    fileType: 'docx',
    jobTitle: 'Frontend Developer',
    jobDescriptionSlug: 'frontend-developer',
    text: `Jordan Okafor
Frontend Developer
jordan.okafor@folderit.net

About me
I am a frontend developer who loves building beautiful user interfaces. I have worked with many technologies and I am always eager to learn new things and grow as a developer in a team that values quality and collaboration and where I can contribute my skills to meaningful products that help people every day.

Work experience
Frontend Developer at Copperline Logistics, 2022 - 2024
I was responsible for the customer portal. I worked on many React components and helped with the migration to TypeScript. I was also involved in meetings with designers and I participated in code reviews.

Intern at Pinecrest Studio, 2021 - 2022
I helped with the company website using HTML, CSS and JavaScript.

Education
Front-End Development Certificate — Harborview Coding School, 2021

Skills
React, TypeScript, HTML, CSS, Git, Figma`,
  },
  {
    slug: 'mei-tanaka',
    fileName: 'mei-tanaka-data-engineer.pdf',
    fileType: 'pdf',
    jobTitle: 'Data Engineer',
    jobDescriptionSlug: 'data-engineer',
    text: `Mei Tanaka
Data Engineer · Denver, CO
mei.tanaka@folderit.net · https://mei-tanaka.folderit.net

Professional summary
Data engineer with five years of experience designing reliable pipelines for analytics and forecasting teams.

Professional experience
Data Engineer — Tidewater Analytics
Aug 2022 – Present
- Built streaming ingestion with Kafka and Apache Spark processing 3 TB of events per day.
- Orchestrated 120 Airflow DAGs and introduced dbt models, cutting report preparation from 2 days to 3 hours.
- Reduced warehouse costs by 27% by partitioning and clustering the largest tables.
- Defined data quality checks that catch 95% of schema drift before it reaches dashboards.

Analytics Engineer — Brightpath Health Systems
Feb 2020 – Jul 2022
- Modeled clinical scheduling data in PostgreSQL for 40 clinics.
- Automated monthly reporting with Python and pandas, saving 30 analyst hours per month.
- Deployed pipelines in Docker with GitLab CI.

Technical skills
Python, SQL, Apache Spark, Kafka, Airflow, dbt, PostgreSQL, Docker, Linux, Git

Education
M.S. Data Science — Lakeshore Institute of Technology, 2019`,
  },
  {
    slug: 'diego-marquez',
    fileName: 'diego-marquez-mobile.pdf',
    fileType: 'pdf',
    text: `Diego Marquez
Mobile Engineer
diego.marquez@folderit.net

Experience
Mobile Engineer — Larkspur Payments
Sep 2020 – Present
• Shipped the React Native wallet app to 250,000 users with a 4.8 store rating.
• Built offline-first sync with SQLite and background queues, reducing failed payments by 22%.
• Designed the shared component library used by 3 mobile squads.
• Worked on the release pipeline with GitHub Actions and Fastlane.

iOS Developer — Pinecrest Studio
May 2017 – Aug 2020
• Developed 9 client apps in Swift and SwiftUI for retail and hospitality brands.
• Improved app startup time by 45% by deferring non-critical work.

Skills
React Native, TypeScript, Swift, Kotlin, REST APIs, GraphQL, Jest, Detox, Git, Figma

Education
B.S. Software Engineering — Coral Bay University, 2017`,
  },
  {
    slug: 'priya-raman',
    fileName: 'priya-raman-devops.docx',
    fileType: 'docx',
    jobTitle: 'Platform Engineer',
    text: `Priya Raman
Platform Engineer · Austin, TX
priya.raman@folderit.net · https://priya-raman.folderit.net

Summary
Platform engineer focused on Kubernetes, infrastructure as code and developer experience.

Experience
Platform Engineer — Copperline Logistics
Jan 2019 – Present
• Designed a Kubernetes platform on AWS hosting 85 services across 4 regions.
• Codified all infrastructure in Terraform, reducing environment setup from 2 weeks to 40 minutes.
• Introduced OpenTelemetry tracing and Grafana dashboards, cutting mean time to recovery by 55%.
• Standardized CI/CD templates used by 22 teams.
• Led incident reviews and wrote the on-call handbook.

Systems Administrator — Ostrander Retail Group
Jun 2015 – Dec 2018
• Maintained 300 Linux servers and automated patching with Bash and Ansible.
• Migrated on-premises file storage to S3, saving $60k per year.

Skills
AWS, Kubernetes, Helm, Terraform, Docker, Linux, Bash, GitHub Actions, Prometheus, Grafana, Python, Go

Certifications
Certified Kubernetes Administrator (CKA), 2020`,
  },
  {
    slug: 'sam-whitfield',
    fileName: 'sam-whitfield-resume.pdf',
    fileType: 'pdf',
    jobTitle: 'Senior Full-Stack Engineer',
    jobDescriptionSlug: 'senior-full-stack',
    text: `Sam Whitfield
Software developer

Profile
Developer looking for new opportunities in a modern company.

Experience
Developer, Harborview Media
Worked on the website and the internal tools. Responsible for maintenance and support tickets. Helped with deployments.

Developer, Freelance
Duties included building websites for small businesses using WordPress and PHP.

Education
Associate degree in Information Technology`,
  },
];
