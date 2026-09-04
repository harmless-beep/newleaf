import { test, expect } from '@playwright/test'

// End-to-end smoke tests against the real production build.
// Each test gets a fresh browser context, so localStorage always starts clean.

const mainNav = (page) => page.getByRole('navigation', { name: 'Main' })
const toolTabs = (page) => page.getByRole('tablist', { name: 'Urge tools' })

// Local calendar key for `daysAgo` days before today (mirrors src/lib/streaks.js).
function dateKeyAgo(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

test('home page loads with greeting, note of the day and tabs', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/New Leaf/)
  // Social sharing card metadata points at the hosted preview image.
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /New Leaf/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-cover\.png$/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
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

test('habits and streaks persist across a reload and between tabs', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Pornography/ }).first().click()
  await expect(page.getByText('Something to celebrate today')).toBeVisible()
  await expect(page.getByText(/best 1 day/)).toBeVisible()

  // Reload: the pick and the run survive without re-choosing anything.
  await page.reload()
  await expect(page.getByText('Something to celebrate today')).toBeVisible()
  await expect(page.getByText('Where you are right now')).toBeVisible()
  await expect(page.getByText(/best 1 day/)).toBeVisible()

  // The same run shows on My journey.
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()
  await expect(page.locator('.habit-card .streak-big')).toHaveText(/1\s*day going strong/)
  await expect(page.getByText(/your best: 1 day/)).toBeVisible()

  // And it's still intact back on Today.
  await mainNav(page).getByRole('button', { name: /Today/ }).click()
  await expect(page.getByText(/best 1 day/)).toBeVisible()
})

const TIER_CASES = [
  { day: 7, label: 'one-week', text: 'One full week', next: 'Next: 10 days' },
  { day: 30, label: 'one-month', text: 'One month', next: 'Next: 45 days' },
  { day: 90, label: 'three-month', text: 'Three months', next: 'Next: 120 days' },
  { day: 365, label: 'one-year', text: 'One full year', next: 'Beyond the milestones' },
]

// Each tier: a run anchored (day - 1) days ago makes today exactly that day.
// The celebration must appear on Today and My journey, with the right next milestone.
for (const c of TIER_CASES) {
  test(`a seeded ${c.day}-day run celebrates its ${c.label} milestone`, async ({ page }) => {
    const anchor = dateKeyAgo(c.day - 1)
    await page.addInitScript(
      ({ anchor }) => {
        localStorage.setItem('nl.picks', JSON.stringify(['smoking']))
        localStorage.setItem('nl.runs', JSON.stringify({ smoking: { anchor, best: 0 } }))
      },
      { anchor }
    )

    await page.goto('/')
    await expect(page.getByText('Something to celebrate today')).toBeVisible()
    await expect(page.getByText(new RegExp(c.text))).toBeVisible()

    await mainNav(page).getByRole('button', { name: /My journey/ }).click()
    await expect(page.locator('.habit-card .streak-big')).toHaveText(new RegExp(`${c.day}\\s*days going strong`))
    await expect(page.locator('.habit-card .celebration')).toContainText(new RegExp(`Day ${c.day}`))
    await expect(page.getByText(new RegExp(c.next))).toBeVisible()
  })
}

test('a seeded month of check-ins and a long run produce a gentle monthly reflection', async ({ page }) => {
  const now = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const prefix = `${now.getFullYear()}-${p(now.getMonth() + 1)}`
  const monthName = now.toLocaleDateString(undefined, { month: 'long' })

  // Seed one check-in per day available so far this month (Bright, plus one
  // Heavy when the month is old enough) and a smoking run anchored 40 days
  // ago, i.e. before this month started.
  const past = []
  for (let i = 0; i < 7; i++) {
    const k = dateKeyAgo(i)
    if (!k.startsWith(prefix)) break
    past.push(k)
  }
  const seeded = {}
  past.forEach((k, i) => {
    seeded[k] = past.length >= 3 && i === 1 ? 'heavy' : 'bright'
  })

  await page.addInitScript(
    ({ runs, checkins }) => {
      localStorage.setItem('nl.picks', JSON.stringify(['smoking']))
      localStorage.setItem('nl.runs', JSON.stringify(runs))
      localStorage.setItem('nl.checkins', JSON.stringify(checkins))
    },
    { runs: { smoking: { anchor: dateKeyAgo(40), best: 0 } }, checkins: seeded }
  )

  await page.goto('/')
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()

  await expect(page.getByRole('heading', { name: new RegExp(`Your ${monthName}, gently`) })).toBeVisible()
  await expect(page.getByText(/Bright was your most common feeling/)).toBeVisible()
  await expect(page.getByText(new RegExp(`kept every day of ${monthName} so far`))).toBeVisible()
  if (past.length >= 3) {
    await expect(page.getByText(/Heavy days were part of this month/)).toBeVisible()
  }
})

test('the journey strip expands into a full-month calendar view and back', async ({ page }) => {
  const now = new Date()
  const monthName = now.toLocaleDateString(undefined, { month: 'long' })

  await page.addInitScript(() => {
    localStorage.setItem('nl.picks', JSON.stringify(['smoking']))
  })
  await page.goto('/')
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()

  // Default view is the week strip; expand to the whole month.
  await expect(page.getByText('Your last seven days')).toBeVisible()
  await page.getByRole('button', { name: /See the whole month/ }).click()
  await expect(page.getByText(`${monthName} at a glance`)).toBeVisible()
  const todayCell = page.locator('.month-cell.today')
  await expect(todayCell).toBeVisible()
  await expect(todayCell.locator('.month-day')).toHaveText(String(now.getDate()))

  // Collapse back to the week.
  await page.getByRole('button', { name: /Back to this week/ }).click()
  await expect(page.getByText('Your last seven days')).toBeVisible()
  await expect(page.locator('.week-strip')).toBeVisible()
})

test('the week strip fills in past moods and kept days from real records', async ({ page }) => {
  // A full week of distinct check-ins (oldest first) and a run anchored six
  // days ago, so every one of the seven cells should show a mood and a ✓.
  const moods = ['heavy', 'bright', 'steady', 'quiet', 'restless', 'steady', 'bright']
  const checkins = {}
  for (let i = 0; i < 7; i++) {
    checkins[dateKeyAgo(6 - i)] = moods[i]
  }
  await page.addInitScript(
    ({ runs, checkins }) => {
      localStorage.setItem('nl.picks', JSON.stringify(['smoking']))
      localStorage.setItem('nl.runs', JSON.stringify(runs))
      localStorage.setItem('nl.checkins', JSON.stringify(checkins))
    },
    { runs: { smoking: { anchor: dateKeyAgo(6), best: 0 } }, checkins }
  )

  await page.goto('/')
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()

  const strip = page.locator('.week-strip')
  await expect(strip.locator('.week-cell')).toHaveCount(7)
  // All seven days were kept.
  await expect(strip.locator('.week-cell .week-kept').filter({ hasText: '✓' })).toHaveCount(7)
  // The cells carry each day's mood by name: oldest is Heavy, today is Bright.
  await expect(strip.locator('.week-cell').nth(0)).toHaveAttribute('aria-label', /Heavy, all paths kept/)
  await expect(strip.locator('.week-cell').nth(6)).toHaveAttribute('aria-label', /Bright, all paths kept/)
})

test('morning check-in records a mood that survives a reload and shows in the journey strip', async ({ page }) => {
  // Pin the clock to mid-morning so the card is deterministically the morning ask.
  await page.clock.install({ time: new Date(2026, 0, 15, 9, 30) })
  await page.goto('/')

  // No check-in yet — the mood picker is shown.
  await expect(page.getByRole('heading', { name: 'How are you feeling today?' })).toBeVisible()
  await page.getByRole('button', { name: /Steady/ }).click()

  // Checked in — the picker gives way to a gentle confirmation.
  await expect(page.getByRole('heading', { name: /Feeling steady/ })).toBeVisible()
  await expect(page.getByText(/Steady is strong/)).toBeVisible()

  // Reload: the check-in persists for the day.
  await page.reload()
  await expect(page.getByRole('heading', { name: /Feeling steady/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How are you feeling today?' })).not.toBeVisible()

  // Add a habit, then open My journey: today's cell shows the mood and a kept ✓.
  await page.getByRole('button', { name: /Pornography/ }).first().click()
  await mainNav(page).getByRole('button', { name: /My journey/ }).click()
  const strip = page.locator('.week-strip')
  await expect(strip).toBeVisible()
  await expect(strip.getByText('🌤')).toBeVisible()
  await expect(strip.getByText('✓', { exact: true })).toBeVisible()
})

test('a skipped morning check-in is caught by a gentle optional evening check-in', async ({ page }) => {
  // Late evening, the morning ask never answered.
  await page.clock.install({ time: new Date(2026, 0, 15, 21, 0) })
  await page.goto('/')

  await expect(page.getByText('Evening check-in')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Morning slipped by/ })).toBeVisible()
  await expect(page.getByText(/no pressure/)).toBeVisible()
  // The morning ask itself no longer nags at night.
  await expect(page.getByRole('heading', { name: 'How are you feeling today?' })).not.toBeVisible()

  await page.getByRole('button', { name: /Heavy/ }).click()
  await expect(page.getByRole('heading', { name: /Ending heavy/ })).toBeVisible()
  await expect(page.getByText(/carried to the end/)).toBeVisible()
  await expect(page.getByText('Evening check-in')).not.toBeVisible()
})

test('a morning check-in can later be joined by an optional evening one', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 0, 15, 9, 30) })
  await page.goto('/')

  await page.getByRole('button', { name: /Steady/ }).click()
  await expect(page.getByRole('heading', { name: /Feeling steady/ })).toBeVisible()

  // Jump to late evening: the optional evening ask appears beside the record.
  await page.clock.fastForward(12 * 60 * 60 * 1000) // 09:30 -> 21:30
  await page.reload()
  await expect(page.getByRole('heading', { name: /How did today actually go\?/ })).toBeVisible()
  await expect(page.getByText(/no pressure/)).toBeVisible()
  await expect(page.getByText(/This morning you felt steady/)).toBeVisible()

  await page.getByRole('button', { name: /Heavy/ }).click()
  await expect(page.getByRole('heading', { name: /Ending heavy/ })).toBeVisible()
  await expect(page.getByText(/Started steady/)).toBeVisible()

  // Both survive a reload — the day stays bookended.
  await page.reload()
  await expect(page.getByRole('heading', { name: /Ending heavy/ })).toBeVisible()
  await expect(page.getByText(/Started steady/)).toBeVisible()
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
