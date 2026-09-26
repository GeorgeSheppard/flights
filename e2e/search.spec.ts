import { expect, test } from '@playwright/test';
import { hoursFromNow, mockApi, mockBasemap, searchResult } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockBasemap(page);
});

test('searching from the map lists matching flights, grouped by when they fly', async ({
  page,
}) => {
  const searched: string[] = [];
  await mockApi(page, {
    '/flights/area': () => ({ json: { aircraft: [] } }),
    '/flights/search': (url) => {
      searched.push(url.searchParams.get('flightNumber') ?? '');
      return {
        json: {
          flights: [
            searchResult('earlier', {
              status: 'Arrived / Gate Arrival',
              scheduledOut: hoursFromNow(-25),
              actualOut: hoursFromNow(-25),
              actualIn: hoursFromNow(-23.7),
            }),
            searchResult('flying', {
              status: 'En Route / On Time',
              scheduledOut: hoursFromNow(-1),
              actualOut: hoursFromNow(-1),
            }),
            searchResult('upcoming', {
              scheduledOut: hoursFromNow(23),
              scheduledIn: hoursFromNow(24.3),
            }),
          ],
        },
      };
    },
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Search flights' }).click();
  await expect(page).toHaveURL(/\/search$/);

  const input = page.getByRole('textbox', { name: 'Flight number' });
  await expect(input).toBeFocused();
  await input.fill('ba 123');
  await input.press('Enter');

  await expect(page).toHaveURL(/\/search\?q=BA123$/);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'In the air',
    'Upcoming',
    'Earlier',
  ]);
  await expect(page.getByText('En Route / On Time')).toBeVisible();
  await expect(page.getByText('Arrived / Gate Arrival')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(3);
  expect(searched).toEqual(['BA123']);
});

test('says when no flights match', async ({ page }) => {
  await mockApi(page, {
    '/flights/search': () => ({ json: { flights: [] } }),
  });
  await page.goto('/search?q=XX1');

  await expect(page.getByText('No flights found for XX1.')).toBeVisible();
});

test('explains when search is not configured on the API', async ({ page }) => {
  await mockApi(page, {
    '/flights/search': () => ({
      status: 501,
      json: { error: 'FlightAware is not configured yet' },
    }),
  });
  await page.goto('/search?q=BA123');

  await expect(page.getByText('Flight search isn’t available yet')).toBeVisible();
});

test('the back button returns to the map', async ({ page }) => {
  await mockApi(page, {
    '/flights/area': () => ({ json: { aircraft: [] } }),
  });
  await page.goto('/search');
  await page.getByRole('button', { name: 'Back to map' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Search flights' })).toBeVisible();
});
