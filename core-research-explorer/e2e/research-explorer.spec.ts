import { expect, test } from '@playwright/test';

test('sends a Boolean query and count, then renders chart and keyboard-operable controls', async ({
  page,
}) => {
  await page.route('**/api/core/works**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        totalHits: 20,
        results: [
          {
            id: 1,
            title: 'Drone delivery systems',
            authors: [],
            abstract: null,
            yearPublished: 2024,
          },
          {
            id: 2,
            title: 'Last-mile aerial logistics',
            authors: ['Research Author'],
            abstract: 'Research abstract',
            yearPublished: 2022,
          },
          {
            id: 3,
            title: 'Autonomous delivery research',
            authors: null,
            abstract: null,
            yearPublished: null,
          },
        ],
      }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Boolean query').fill('drone AND (package OR delivery)');
  await page.getByLabel('Number of papers').selectOption('20');
  await page.getByRole('button', { name: 'Search' }).press('Enter');

  await expect(page.getByText(/Retrieved 3 paper\(s\)/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Publication year distribution' })).toBeVisible();
  await expect(page.locator('.year-chart svg')).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(2);
  await expect(page.getByText(/1 paper\(s\) excluded/)).toBeVisible();

  await page.getByLabel('Boolean query').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Number of papers')).toBeFocused();
});

test('shows loading, empty, and error states with intercepted API responses', async ({ page }) => {
  await page.route('**/api/core/works**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ totalHits: 0, results: [] }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Boolean query').fill('drone delivery');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Searching CORE...')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No papers found' })).toBeVisible();

  await page.unroute('**/api/core/works**');
  await page.route('**/api/core/works**', (route) =>
    route.fulfill({ status: 429, contentType: 'application/json', body: '{}' }),
  );
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name: 'Search unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
