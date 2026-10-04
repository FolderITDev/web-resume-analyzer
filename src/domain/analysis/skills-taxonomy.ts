import { type SkillCategory } from '@/lib/validation/analysis';

export type SkillDefinition = {
  id: string;
  name: string;
  category: SkillCategory;
  /** Lowercase spellings matched as whole terms. The display name is matched implicitly. */
  aliases?: readonly string[];
};

/**
 * The skills the engine recognizes. Matching is literal and case-insensitive, so ambiguous
 * single-letter or dictionary words (Go, R, C, Swift as a verb) are only matched through an
 * unambiguous alias.
 */
export const SKILLS: readonly SkillDefinition[] = [
  // Languages
  { id: 'typescript', name: 'TypeScript', category: 'language' },
  { id: 'javascript', name: 'JavaScript', category: 'language', aliases: ['es6', 'ecmascript'] },
  { id: 'python', name: 'Python', category: 'language' },
  { id: 'java', name: 'Java', category: 'language' },
  { id: 'kotlin', name: 'Kotlin', category: 'language' },
  { id: 'csharp', name: 'C#', category: 'language', aliases: ['c sharp'] },
  { id: 'cpp', name: 'C++', category: 'language' },
  { id: 'golang', name: 'Go', category: 'language', aliases: ['golang', 'go lang'] },
  { id: 'rust', name: 'Rust', category: 'language' },
  { id: 'ruby', name: 'Ruby', category: 'language' },
  { id: 'php', name: 'PHP', category: 'language' },
  { id: 'swift', name: 'Swift', category: 'language', aliases: ['swiftui'] },
  { id: 'scala', name: 'Scala', category: 'language' },
  { id: 'sql', name: 'SQL', category: 'language', aliases: ['t-sql', 'pl/sql'] },
  { id: 'html', name: 'HTML', category: 'language', aliases: ['html5'] },
  { id: 'css', name: 'CSS', category: 'language', aliases: ['css3', 'sass', 'scss'] },
  // Frontend
  { id: 'react', name: 'React', category: 'frontend', aliases: ['react.js', 'reactjs'] },
  { id: 'react-native', name: 'React Native', category: 'frontend' },
  { id: 'nextjs', name: 'Next.js', category: 'frontend', aliases: ['nextjs', 'next js'] },
  { id: 'vue', name: 'Vue.js', category: 'frontend', aliases: ['vue', 'vuejs', 'nuxt'] },
  { id: 'angular', name: 'Angular', category: 'frontend' },
  { id: 'svelte', name: 'Svelte', category: 'frontend', aliases: ['sveltekit'] },
  { id: 'redux', name: 'Redux', category: 'frontend', aliases: ['redux toolkit'] },
  { id: 'tanstack-query', name: 'TanStack Query', category: 'frontend', aliases: ['react query'] },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind'] },
  { id: 'webpack', name: 'Webpack', category: 'frontend', aliases: ['vite', 'turbopack'] },
  { id: 'accessibility', name: 'Accessibility', category: 'frontend', aliases: ['a11y', 'wcag'] },
  { id: 'flutter', name: 'Flutter', category: 'frontend', aliases: ['dart'] },
  // Backend
  { id: 'nodejs', name: 'Node.js', category: 'backend', aliases: ['node', 'nodejs', 'node js'] },
  { id: 'express', name: 'Express', category: 'backend', aliases: ['express.js', 'expressjs'] },
  { id: 'nestjs', name: 'NestJS', category: 'backend', aliases: ['nest.js'] },
  { id: 'fastify', name: 'Fastify', category: 'backend' },
  { id: 'django', name: 'Django', category: 'backend' },
  { id: 'flask', name: 'Flask', category: 'backend', aliases: ['fastapi'] },
  {
    id: 'spring',
    name: 'Spring Boot',
    category: 'backend',
    aliases: ['spring', 'spring framework'],
  },
  { id: 'dotnet', name: '.NET', category: 'backend', aliases: ['asp.net', 'dotnet', '.net core'] },
  { id: 'rails', name: 'Ruby on Rails', category: 'backend', aliases: ['rails'] },
  { id: 'laravel', name: 'Laravel', category: 'backend' },
  {
    id: 'rest',
    name: 'REST APIs',
    category: 'backend',
    aliases: ['restful', 'rest api', 'rest apis', 'restful apis'],
  },
  { id: 'graphql', name: 'GraphQL', category: 'backend', aliases: ['apollo'] },
  { id: 'grpc', name: 'gRPC', category: 'backend' },
  { id: 'microservices', name: 'Microservices', category: 'backend', aliases: ['microservice'] },
  { id: 'kafka', name: 'Kafka', category: 'backend', aliases: ['rabbitmq', 'message queues'] },
  { id: 'oauth', name: 'OAuth', category: 'backend', aliases: ['openid connect', 'oidc', 'jwt'] },
  // Data
  { id: 'postgresql', name: 'PostgreSQL', category: 'data', aliases: ['postgres', 'postgresql'] },
  { id: 'mysql', name: 'MySQL', category: 'data', aliases: ['mariadb'] },
  { id: 'mongodb', name: 'MongoDB', category: 'data', aliases: ['mongo', 'mongoose'] },
  { id: 'redis', name: 'Redis', category: 'data' },
  { id: 'elasticsearch', name: 'Elasticsearch', category: 'data', aliases: ['opensearch'] },
  { id: 'sql-server', name: 'SQL Server', category: 'data', aliases: ['mssql'] },
  {
    id: 'orm',
    name: 'ORMs',
    category: 'data',
    aliases: ['prisma', 'drizzle', 'typeorm', 'hibernate', 'sequelize', 'entity framework'],
  },
  { id: 'pandas', name: 'pandas', category: 'data', aliases: ['numpy'] },
  { id: 'spark', name: 'Apache Spark', category: 'data', aliases: ['spark', 'pyspark'] },
  { id: 'airflow', name: 'Airflow', category: 'data', aliases: ['dbt'] },
  {
    id: 'machine-learning',
    name: 'Machine learning',
    category: 'data',
    aliases: ['ml', 'scikit-learn', 'pytorch', 'tensorflow'],
  },
  {
    id: 'llm',
    name: 'LLMs',
    category: 'data',
    aliases: ['llm', 'rag', 'prompt engineering', 'generative ai'],
  },
  {
    id: 'data-modeling',
    name: 'Data modeling',
    category: 'data',
    aliases: ['database design', 'schema design'],
  },
  // Cloud and DevOps
  {
    id: 'aws',
    name: 'AWS',
    category: 'cloud',
    aliases: ['amazon web services', 'lambda', 'ec2', 's3'],
  },
  { id: 'azure', name: 'Azure', category: 'cloud' },
  { id: 'gcp', name: 'Google Cloud', category: 'cloud', aliases: ['gcp'] },
  { id: 'docker', name: 'Docker', category: 'cloud', aliases: ['containers'] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'cloud', aliases: ['k8s', 'helm'] },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'cloud',
    aliases: ['infrastructure as code', 'pulumi', 'cloudformation'],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD',
    category: 'cloud',
    aliases: ['ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'continuous integration'],
  },
  { id: 'linux', name: 'Linux', category: 'cloud', aliases: ['bash', 'shell scripting'] },
  {
    id: 'observability',
    name: 'Observability',
    category: 'cloud',
    aliases: ['monitoring', 'datadog', 'grafana', 'prometheus', 'opentelemetry'],
  },
  { id: 'vercel', name: 'Vercel', category: 'cloud', aliases: ['netlify'] },
  // Testing
  {
    id: 'unit-testing',
    name: 'Unit testing',
    category: 'testing',
    aliases: ['jest', 'vitest', 'unit tests', 'pytest', 'junit'],
  },
  {
    id: 'e2e-testing',
    name: 'End-to-end testing',
    category: 'testing',
    aliases: ['playwright', 'cypress', 'selenium', 'e2e'],
  },
  { id: 'tdd', name: 'Test-driven development', category: 'testing', aliases: ['tdd'] },
  {
    id: 'testing-library',
    name: 'Testing Library',
    category: 'testing',
    aliases: ['react testing library'],
  },
  // Practices
  { id: 'agile', name: 'Agile', category: 'practice', aliases: ['scrum', 'kanban'] },
  { id: 'git', name: 'Git', category: 'practice', aliases: ['github', 'gitlab', 'bitbucket'] },
  {
    id: 'code-review',
    name: 'Code review',
    category: 'practice',
    aliases: ['code reviews', 'pull requests'],
  },
  {
    id: 'system-design',
    name: 'System design',
    category: 'practice',
    aliases: ['software architecture', 'distributed systems'],
  },
  { id: 'mentoring', name: 'Mentoring', category: 'practice', aliases: ['mentored', 'coaching'] },
  {
    id: 'security',
    name: 'Application security',
    category: 'practice',
    aliases: ['owasp', 'security'],
  },
  {
    id: 'performance',
    name: 'Performance optimization',
    category: 'practice',
    aliases: ['core web vitals', 'performance tuning'],
  },
  // Design
  { id: 'figma', name: 'Figma', category: 'design' },
  {
    id: 'ux',
    name: 'UX design',
    category: 'design',
    aliases: ['ux', 'user experience', 'ui/ux', 'ux/ui'],
  },
  {
    id: 'design-systems',
    name: 'Design systems',
    category: 'design',
    aliases: ['design system', 'storybook'],
  },
];
