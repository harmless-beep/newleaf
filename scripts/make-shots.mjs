// Captures the warm phone-sized screenshots used in the README.
// Run:  npm run build && npm run preview (or reuse the test server) then:
//       node scripts/make-shots.mjs http://127.0.0.1:4173
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const baseURL = process.argv[2] || 'http://127.0.0.1:4173'
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, 'public', 'screenshots')
fs.mkdirSync(outDir, { recursive: true })

const dateKeyAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// A small but real-feeling history: two habits being softened, a solid
// smoking run, varied moods over the past week (today left open), a couple
// of journal entries, and a small step for tomorrow.
const seed = {
  'nl.picks': ['smoking', 'alcohol'],
  'nl.runs': {
    smoking: { anchor: dateKeyAgo(13), best: 0 },
    alcohol: { anchor: dateKeyAgo(3), best: 0 },
  },
  'nl.checkins': {
    [dateKeyAgo(6)]: 'quiet',
    [dateKeyAgo(5)]: 'steady',
    [dateKeyAgo(4)]: 'bright',
    [dateKeyAgo(3)]: 'steady',
    [dateKeyAgo(2)]: 'heavy',
    [dateKeyAgo(1)]: 'steady',
  },
  'nl.journal': [
    { date: dateKeyAgo(2), text: 'Evening came heavier than the morning promised. I noticed it, sat with it, and let the wave pass without acting on it. That counts.' },
    { date: dateKeyAgo(5), text: 'Three evenings in a row with no urge at all. Grateful for the quiet ones.' },
  ],
  'nl.steps': { [dateKeyAgo(0)]: 'drink a full glass of water before coffee' },
  // Day 14 (smoking) was already honoured, so the transient leaf burst does
  // not freeze mid-air inside the screenshots.
  'nl.celebrated': { smoking: 14 },
}

const browser = await chromium.launch()
const viewport = { width: 390, height: 844 }
const shot = async (name, opts = {}) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 })
  await page.addInitScript((s) => {
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v))
  }, seed)
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.getElementById('root')?.innerText?.length > 40)
  await page.waitForTimeout(500)
  await opts.prepare?.(page)
  await page.waitForTimeout(600) // let the page fade in
  await page.screenshot({ path: path.join(outDir, name) })
  await page.close()
  console.log('wrote', name)
}

// 1. The morning ask — the heart of the app.
await shot('today-morning.png', {
  prepare: async (page) => {
    // Make sure we're on Today with the check-in still open.
    const today = await page.locator('button', { hasText: 'Today' }).first()
    await today.click()
  },
})

// 2. After a gentle check-in — the warm response and streaks.
await shot('today-checked-in.png', {
  prepare: async (page) => {
    const steady = page.locator('button', { hasText: 'Steady' }).first()
    if (await steady.isVisible()) await steady.click()
  },
})

// 3. My journey — habits, streaks, and the week strip.
await shot('journey.png', {
  prepare: async (page) => {
    await page.locator('button', { hasText: 'My journey' }).first().click()
  },
})

// 4. Urge tools — what to do in a hard moment.
await shot('urge-tools.png', {
  prepare: async (page) => {
    await page.locator('button', { hasText: 'Urge tools' }).first().click()
  },
})

await browser.close()
console.log('done →', outDir)