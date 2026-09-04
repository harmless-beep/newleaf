import { test, expect } from '@playwright/test'

// End-to-end smoke tests against the real production build.
// Each test gets a fresh browser context, so localStorage always starts clean.

const mainNav = (page) => page.getByRole('navigation', { name: 'Main' })
const toolTabs = (page) => page.getByRole('tablist', { name: 'Urge tools' })

test('home page loads with greeting, note of the day and tabs', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/New Leaf/)
  await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
    /Good (morning|afternoon|evening)|Still up\?/
  )
  await expect(page.getByText('Your gentle note for today')).toBeVisible()
  await expect(page.getByText('one day at a time')).toBeVisible()
  await expect(mainNav(page).getByRole('button', { name: /My journey/ })).toBeVisible()
  await expect(mainNav(page).getByRole('button', { name: /Urge tools/ })).toBeVisible()
})

test('choosing a habit celebrates day one and shows in the overview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Pornography/ }).first().click()
  await expect(page.getByText('Something to celebrate today')).toBeVisible()
  await expect(page.getByText(/Day one — the bravest day of all/)).toBeVisible()
  await expect(page.getByText('Where you are right now')).toBeVisible()
  await expect(page.getByText(/best 1 day/)).toBeVisible()
})

test('a slip resets the count gently and keeps the best streak', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Pornography/ }).first().click()
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()
  await expect(page.getByRole('heading', { name: 'My journey' })).toBeVisible()

  await page.getByRole('button', { name: /I slipped today/ }).click()
  await expect(page.getByRole('alertdialog', { name: 'Confirm a slip' })).toBeVisible()
  await page.getByRole('button', { name: /starting again/ }).click()

  // The count rests gently at a fresh start — but the best run is kept.
  await expect(page.getByText('A fresh start')).toBeVisible()
  await expect(page.getByText(/your best: 1 day/)).toBeVisible()
})

test('urge tools: breathing, grounding, ride the wave and journal all work', async ({ page }) => {
  await page.goto('/')
  await mainNav(page).getByRole('button', { name: /Urge tools/ }).click()
  await expect(page.getByRole('heading', { name: 'Urge tools' })).toBeVisible()

  // Breathing: start -> pause -> stop
  await page.getByRole('button', { name: 'Start breathing' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Start breathing' })).toBeVisible()

  // Grounding: walk all five senses to completion
  await toolTabs(page).getByRole('tab', { name: /Ground/ }).click()
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /Next:/ }).click()
  }
  await page.getByRole('button', { name: /here now/ }).click()
  await expect(page.getByText(/You’re here now — in this room/)).toBeVisible()
  await page.getByRole('button', { name: /Go through it again/ }).click()
  await expect(page.getByRole('button', { name: /Next:/ })).toBeVisible()

  // Ride the wave: start the 5-minute timer, then stop early
  await toolTabs(page).getByRole('tab', { name: /Ride it out/ }).click()
  await page.getByRole('button', { name: '5 minutes', exact: true }).click()
  await expect(page.locator('.ride-clock')).toHaveText('05:00')
  await page.getByRole('button', { name: /Stop early/ }).click()
  await expect(page.getByRole('button', { name: '5 minutes', exact: true })).toBeVisible()

  // Journal: write, save, then delete
  await toolTabs(page).getByRole('tab', { name: /Write it out/ }).click()
  await page.getByPlaceholder(/What’s happening right now\?/).fill('Today was hard, but I stayed with it.')
  await page.getByRole('button', { name: 'Let it out' }).click()
  await expect(page.getByText('Today was hard, but I stayed with it.')).toBeVisible()
  await page.getByRole('button', { name: 'Delete entry' }).click()
  await expect(page.getByText('Nothing here yet.')).toBeVisible()
})
