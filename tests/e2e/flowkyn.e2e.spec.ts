import { test, expect } from '@playwright/test';

// These tests assume:
// - Frontend runs at http://localhost:3000
// - There is an auth login page at /login with email/password inputs
// - Event creation form uses placeholders "Event title" and "Description"
// - Lobby/chat inputs use placeholder matching /Type a message/i
// Adjust selectors/URLs to your actual app as needed.

async function loginAsMember(page: any) {
  const email = process.env.E2E_MEMBER_EMAIL || 'member@example.com';
  const password = process.env.E2E_MEMBER_PASSWORD || 'Password123!';

  await page.goto('http://localhost:3000/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/events|dashboard/);
}

test.describe('Authenticated member flow', () => {
  test('create → invite → lobby chat → game chat → posts', async ({ page }) => {
    await loginAsMember(page);

    // Navigate to create event / activity launch
    await page.goto('http://localhost:3000/events/new');

    // Fill basic event info
    await page.getByPlaceholder('Event title').fill('Playwright E2E Event');
    await page.getByPlaceholder('Description').fill('E2E test event');
    await page.getByRole('button', { name: /Create event/i }).click();

    // Expect to land on event detail or list and open lobby
    await expect(page).toHaveURL(/events/);
    await page.getByRole('button', { name: /Lobby|Join lobby/i }).click();

    // In lobby, send a chat message
    await page.getByPlaceholder(/Type a message/i).fill('Hello from E2E test');
    await page.getByRole('button', { name: /Send/i }).click();
    await expect(page.getByText('Hello from E2E test')).toBeVisible();

    // Enter game and verify chat is still visible
    await page.getByRole('button', { name: /Enter game/i }).click();
    await expect(page.getByText('Hello from E2E test')).toBeVisible();

    // TODO: Extend for async game (Wins of the Week) to create a post and verify it appears.
  });
});

test.describe('Guest flow with reconnect', () => {
  test('join via link → lobby chat → game chat → reconnect backfill', async ({ page, context }) => {
    const joinUrl = process.env.E2E_JOIN_URL;
    if (!joinUrl) test.skip(true, 'E2E_JOIN_URL not set');

    await page.goto(joinUrl!);

    // Complete profile as guest
    await page.getByPlaceholder(/Nickname/i).fill('Guest E2E');
    await page.getByRole('button', { name: /Continue/i }).click();

    // In lobby, send a message
    await page.getByPlaceholder(/Type a message/i).fill('Guest hello');
    await page.getByRole('button', { name: /Send/i }).click();
    await expect(page.getByText('Guest hello')).toBeVisible();

    // Enter game
    await page.getByRole('button', { name: /Enter game/i }).click();
    await expect(page.getByText('Guest hello')).toBeVisible();

    // Simulate offline/online by toggling network
    await context.setOffline(true);
    await page.getByPlaceholder(/Type a message/i).fill('While offline');
    await context.setOffline(false);

    // After reconnect, send a new message and ensure history is present
    await page.getByPlaceholder(/Type a message/i).fill('Back online');
    await page.getByRole('button', { name: /Send/i }).click();
    await expect(page.getByText('Guest hello')).toBeVisible();
    await expect(page.getByText('Back online')).toBeVisible();
  });
});

