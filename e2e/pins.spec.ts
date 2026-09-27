import { expect, test, type Page } from '@playwright/test';
import { mockApi, mockBasemap } from './mocks';

async function openMap(page: Page) {
  const areaRequests: URL[] = [];
  await mockBasemap(page);
  await mockApi(page, {
    '/flights/area': (url) => {
      areaRequests.push(url);
      return { json: { aircraft: [] } };
    },
  });
  await page.goto('/');
  await expect.poll(() => areaRequests.length).toBeGreaterThan(0);
  return areaRequests;
}

const longitudeSpan = (url: URL) =>
  Number(url.searchParams.get('maxLongitude')) - Number(url.searchParams.get('minLongitude'));

const contains = (url: URL, place: { longitude: number; latitude: number }) =>
  Number(url.searchParams.get('minLongitude')) < place.longitude &&
  Number(url.searchParams.get('maxLongitude')) > place.longitude &&
  Number(url.searchParams.get('minLatitude')) < place.latitude &&
  Number(url.searchParams.get('maxLatitude')) > place.latitude;

async function seedPins(page: Page, pins: { name: string; longitude: number; latitude: number }[]) {
  const saved = pins.map((pin, index) => ({ ...pin, id: String(index), zoom: 9 }));
  await page.addInitScript(
    (value) => localStorage.setItem('flights:pins:v1', value),
    JSON.stringify(saved)
  );
}

async function addPin(page: Page, name: string) {
  const dialog = page.getByRole('dialog', { name: 'Add pin' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Pin name' }).fill(name);
  await dialog.getByRole('button', { name: 'Save pin' }).click();
  await expect(dialog).toBeHidden();
}

test('pinning the current view adds it to the map', async ({ page }) => {
  await openMap(page);

  await page.getByRole('button', { name: 'Pins' }).click();
  await expect(page.getByText('No pins yet')).toBeVisible();
  await page.getByRole('button', { name: 'Pin this view' }).click();
  await addPin(page, 'Heathrow');

  await expect(page.getByRole('button', { name: 'Go to Heathrow' })).toBeVisible();
});

test('choosing a pin from the menu flies to it', async ({ page }) => {
  const edinburgh = { name: 'Edinburgh', longitude: -3.19, latitude: 55.95 };
  await seedPins(page, [edinburgh]);
  const areaRequests = await openMap(page);
  expect(contains(areaRequests.at(-1)!, edinburgh)).toBe(false);

  await page.getByRole('button', { name: 'Pins' }).click();
  await page.getByRole('button', { name: 'Edinburgh', exact: true }).click();

  await expect.poll(() => contains(areaRequests.at(-1)!, edinburgh)).toBe(true);
  // Pins fly to a closer zoom than the initial view, so the area is smaller.
  expect(longitudeSpan(areaRequests.at(-1)!)).toBeLessThan(longitudeSpan(areaRequests[0]!));
});

test('right-clicking the map drops a pin that survives a reload', async ({ page }) => {
  await openMap(page);

  await page.locator('canvas.maplibregl-canvas').click({ button: 'right' });
  await addPin(page, 'Home');
  await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible();
});

test('tapping a pin on the map flies to it', async ({ page }) => {
  // Close enough to the initial view to be on screen, but not in the middle of it.
  const home = { name: 'Home', longitude: 0.3, latitude: 51.75 };
  await seedPins(page, [home]);
  const areaRequests = await openMap(page);
  const initialSpan = longitudeSpan(areaRequests.at(-1)!);

  await page.getByRole('button', { name: 'Go to Home' }).click();

  await expect.poll(() => longitudeSpan(areaRequests.at(-1)!)).toBeLessThan(initialSpan);
  expect(contains(areaRequests.at(-1)!, home)).toBe(true);
});

test('pins can be removed', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Pins' }).click();
  await page.getByRole('button', { name: 'Pin this view' }).click();
  await addPin(page, 'Temporary');

  await page.getByRole('button', { name: 'Pins' }).click();
  await page.getByRole('button', { name: 'Remove Temporary' }).click();

  await expect(page.getByRole('button', { name: 'Go to Temporary' })).toBeHidden();
  await expect(page.getByText('No pins yet')).toBeVisible();
});

test('long-pressing the map on a touch screen drops a pin', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch only');
  await openMap(page);

  const canvas = page.locator('canvas.maplibregl-canvas');
  const box = (await canvas.boundingBox())!;
  const touch = { identifier: 0, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  await canvas.dispatchEvent('touchstart', { touches: [touch], changedTouches: [touch] });
  await page.waitForTimeout(700);
  await canvas.dispatchEvent('touchend', { touches: [], changedTouches: [touch] });

  await addPin(page, 'Pressed');
  await expect(page.getByRole('button', { name: 'Go to Pressed' })).toBeVisible();
});
