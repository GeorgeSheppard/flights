import { expect, test } from '@playwright/test';
import { aircraft, flightDetails, hoursFromNow, mockApi, mockBasemap, searchResult } from './mocks';

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
  // The flight in the air and the plane for the next flight can be found on the map.
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Show on map/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Find my plane/ })).toHaveCount(1);
  expect(searched).toEqual(['BA123']);
});

test('tapping a flight in the air shows it on the map', async ({ page }) => {
  const located: string[] = [];
  await mockApi(page, {
    '/flights/area': () => ({ json: { aircraft: [aircraft] } }),
    '/flights/details': () => ({ json: flightDetails }),
    '/flights/photo': () => ({ json: { photo: null } }),
    '/flights/search': () => ({
      json: { flights: [searchResult('flying', { actualOut: hoursFromNow(-1) })] },
    }),
    '/flights/locate': (url) => {
      located.push(url.searchParams.get('faFlightId') ?? '');
      return { json: { aircraft, inboundFlight: null } };
    },
  });
  await page.goto('/search?q=BA123');

  await page.getByRole('button', { name: /Show on map/ }).click();

  await expect(page).toHaveURL(/\/\?flight=4ca7b3&callsign=BAW123$/);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'BAW123' })).toBeVisible();
  expect(located).toEqual(['flying']);

  await page.goBack();
  await expect(page).toHaveURL(/\/search\?q=BA123$/);
});

test('tapping the next flight shows the plane flying in to operate it', async ({ page }) => {
  const inbound = { ...aircraft, callsign: 'BAW122' };
  await mockApi(page, {
    '/flights/area': () => ({ json: { aircraft: [inbound] } }),
    '/flights/details': () => ({ json: { ...flightDetails, callsign: 'BAW122' } }),
    '/flights/photo': () => ({ json: { photo: null } }),
    '/flights/search': () => ({
      json: { flights: [searchResult('next', { scheduledOut: hoursFromNow(2) })] },
    }),
    '/flights/locate': () => ({
      json: { aircraft: inbound, inboundFlight: searchResult('inbound', { ident: 'BAW122' }) },
    }),
  });
  await page.goto('/search?q=BA123');

  await page.getByRole('button', { name: /Find my plane/ }).click();

  await expect(page).toHaveURL(/\/\?flight=4ca7b3&callsign=BAW122$/);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'BAW122' })).toBeVisible();
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
