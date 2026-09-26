import { expect, test, type Page } from '@playwright/test';
import { aircraft, flightDetails, mockApi, mockBasemap } from './mocks';

async function openMapWithAircraft(page: Page, path = '/') {
  const areaRequests: URL[] = [];
  await mockBasemap(page);
  await mockApi(page, {
    '/flights/area': (url) => {
      areaRequests.push(url);
      return { json: { aircraft: [aircraft] } };
    },
    '/flights/details': () => ({ json: flightDetails }),
  });
  await page.goto(path);
  await expect(page.getByText('1 flight', { exact: true })).toBeVisible();
  return areaRequests;
}

// The mocked aircraft sits at the initial map centre. It's drawn a frame after its data arrives,
// so keep tapping until the tap lands on it.
async function tapAircraft(page: Page) {
  const sheet = page.getByRole('dialog');
  await expect(async () => {
    await page.locator('canvas.maplibregl-canvas').click();
    await expect(sheet).toBeVisible({ timeout: 1_000 });
  }).toPass();
  return sheet;
}

test('shows the aircraft in the current viewport', async ({ page }) => {
  const areaRequests = await openMapWithAircraft(page);

  const query = Object.fromEntries(areaRequests[0]!.searchParams);
  expect(Number(query.minLatitude)).toBeLessThan(aircraft.latitude);
  expect(Number(query.maxLatitude)).toBeGreaterThan(aircraft.latitude);
  expect(Number(query.minLongitude)).toBeLessThan(aircraft.longitude);
  expect(Number(query.maxLongitude)).toBeGreaterThan(aircraft.longitude);
});

test('tapping an aircraft shows its details', async ({ page }) => {
  await openMapWithAircraft(page);
  const sheet = await tapAircraft(page);

  await expect(sheet.getByRole('heading', { name: 'BAW123' })).toBeVisible();
  await expect(sheet.getByText('British Airways')).toBeVisible();
  await expect(sheet.getByText('LHR', { exact: true })).toBeVisible();
  await expect(sheet.getByText('EDI', { exact: true })).toBeVisible();
  await expect(sheet.getByText('35,000 ft')).toBeVisible();
  await expect(page).toHaveURL(/\?flight=4ca7b3&callsign=BAW123$/);

  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('going back closes the details', async ({ page }) => {
  await openMapWithAircraft(page);
  const sheet = await tapAircraft(page);

  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('a shared link opens straight to the flight', async ({ page }) => {
  await openMapWithAircraft(page, '/?flight=4ca7b3&callsign=BAW123');

  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'BAW123' })).toBeVisible();
  await expect(sheet.getByText('British Airways')).toBeVisible();
});

test('asks the user to zoom in rather than loading the whole world', async ({ page }) => {
  const areaRequests = await openMapWithAircraft(page);
  const zoomOut = page.getByRole('button', { name: 'Zoom out' });

  for (let i = 0; i < 3; i++) {
    await zoomOut.click();
    await page.waitForTimeout(400);
  }

  await expect(page.getByText('Zoom in to see flights')).toBeVisible();
  const requestsWhenZoomedOut = areaRequests.length;
  await page.waitForTimeout(500);
  expect(areaRequests).toHaveLength(requestsWhenZoomedOut);
});

test('reports when flights fail to load', async ({ page }) => {
  await mockBasemap(page);
  await mockApi(page, {
    '/flights/area': () => ({ status: 500, json: { error: 'OpenSky is down' } }),
  });
  await page.goto('/');

  await expect(page.getByText('Couldn’t load flights')).toBeVisible({ timeout: 15_000 });
});
