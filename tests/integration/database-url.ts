/** The test database, created by docker/init-test-db.sql. Never the development database. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://resume:resume@localhost:5441/resume_analyzer_test';
