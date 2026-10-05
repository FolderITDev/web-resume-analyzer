import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('analyze a resume', () => {
  test('uploads a PDF, follows the pipeline and reads the report', async ({ page }) => {
    await page.goto('analyze');
    await page
      .getByLabel(/drop your resume here/i)
      .setInputFiles('tests/fixtures/avery-lindqvist.pdf');
    await expect(page.getByText('avery-lindqvist.pdf')).toBeVisible();

    await page.getByRole('button', { name: 'Analyze resume' }).click();
    await expect(page).toHaveURL(/\/analyses\/[0-9a-f-]{36}$/);

    await expect(page.getByRole('heading', { name: 'What to change first' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole('heading', { level: 1, name: 'avery-lindqvist.pdf' }),
    ).toBeVisible();
    await expect(page.getByRole('meter', { name: 'Structure' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    await expect(page.getByRole('heading', { name: 'Skills a reviewer will see' })).toBeVisible();

    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByRole('link', { name: 'avery-lindqvist.pdf' })).toBeVisible();
  });

  test('compares an example resume with its job description', async ({ page }) => {
    await page.goto('analyze?example=frontend-developer');
    await expect(page.getByText('jordan-okafor-cv.docx')).toBeVisible();
    await expect(page.getByLabel('Job title')).toHaveValue('Frontend Developer');

    await page.getByRole('button', { name: 'Analyze resume' }).click();
    await expect(page.getByRole('heading', { name: 'Match with the job description' })).toBeVisible(
      {
        timeout: 20_000,
      },
    );
    await expect(page.getByRole('meter', { name: 'Match score' })).toBeVisible();
  });

  test('explains why an unsupported file is rejected', async ({ page }) => {
    await page.goto('analyze');
    await page.getByLabel(/drop your resume here/i).setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a resume'),
    });
    await page.getByRole('button', { name: 'Analyze resume' }).click();
    await expect(page.getByText('Only PDF and DOCX files are supported.')).toBeVisible();
  });
});

test.describe('public pages', () => {
  test('the landing page is indexable, structured and accessible', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Read your resume the way a reviewer does.',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/apps\/resume-analyzer$/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts
          .flatMap((script) => JSON.parse(script.textContent ?? '[]'))
          .map((item) => item['@type']),
      );
    expect(types).toEqual(expect.arrayContaining(['Organization', 'BreadcrumbList', 'FAQPage']));
  });

  for (const path of ['', 'docs/api', 'analyze', 'analyses']) {
    test(`has no WCAG 2.2 AA violations on /${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`,
        ),
      ).toEqual([]);
    });
  }

  test('the tool is excluded from search results', async ({ page }) => {
    await page.goto('analyze');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
