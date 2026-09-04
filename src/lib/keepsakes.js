import { HABIT_BY_ID } from '../data/habits.js'
import { MOOD_BY_ID } from '../data/wisdom.js'
import { dayMood } from './checkins.js'
import { reflectionText } from './reflection.js'
import { dateKey, daysBetween, streakFor } from './streaks.js'

// A keepsake is the frozen record of a *closed* month: its moods, its kept
// paths, the reflection words the app said about it, and a journal excerpt.
// Because a run's anchor only moves forward, live recomputation quietly loses
// old months' path claims after a later slip ("the run began after that month
// ended"), even though the month itself was genuinely kept. The snapshot is
// taken automatically at the first load after a month closes (and backfilled
// once for every recorded month), so what a month truly was can never be
// rewritten afterwards. All of it stays on this device.

const pad = (n) => String(n).padStart(2, '0')

export const currentMonth = (today) => today.slice(0, 7)

export function monthEndKey(prefix) {
  const [y, m] = prefix.split('-').map(Number)
  return `${prefix}-${pad(new Date(y, m, 0).getDate())}`
}

export function shiftMonth(prefix, delta) {
  const [y, m] = prefix.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const monthLabel = (prefix) => {
  const [y, m] = prefix.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

const entryMonth = (e) => {
  const d = new Date(e.at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// Freeze one closed month exactly as the records support it today. Days before
// a run began read as untracked; a run that began after the month ended cannot
// vouch for it and is left out — the same honesty rules the live views use.
export function captureMonth(prefix, { today, picks, runs, checkins, journal = [] }) {
  const [y, m] = prefix.split('-').map(Number)
  const startKey = `${prefix}-01`
  const last = new Date(y, m, 0).getDate()
  const endKey = `${prefix}-${pad(last)}`
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long' })

  // The exact reflection words (past tense) — frozen so they can never drift.
  const ref = reflectionText({ today, picks, runs, checkins, monthKey: prefix, past: true })

  const days = []
  let daysChecked = 0
  let allKeptDays = 0
  const counts = {}
  for (let d = 1; d <= last; d++) {
    const key = `${prefix}-${pad(d)}`
    const moodId = dayMood(checkins, key)
    if (moodId && MOOD_BY_ID[moodId]) {
      daysChecked += 1
      counts[moodId] = (counts[moodId] || 0) + 1
    }
    const tracked = picks.filter((id) => {
      const run = runs[id]
      return run && key >= run.anchor
    })
    const kept = tracked.filter((id) => streakFor(runs[id], key) >= 1).length
    if (tracked.length && kept === tracked.length) allKeptDays += 1
    days.push({ d, moodId, kept, tracked: tracked.length })
  }
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const topMood = topEntry ? { ...MOOD_BY_ID[topEntry[0]], id: topEntry[0], count: topEntry[1] } : null

  // Per-habit claims at month close (structured; the shelf renders them short).
  const habits = []
  for (const id of picks) {
    const run = runs[id]
    if (!run || run.anchor > today || run.anchor > endKey) continue
    const habit = HABIT_BY_ID[id]
    habits.push({
      emoji: habit.emoji,
      name: habit.name,
      wholeMonth: run.anchor <= startKey,
      keptDays: daysBetween(run.anchor > startKey ? run.anchor : startKey, endKey) + 1,
      from: run.anchor > startKey ? run.anchor : null,
    })
  }

  const monthJournal = journal.filter((e) => entryMonth(e) === prefix)
  monthJournal.sort((a, b) => new Date(a.at) - new Date(b.at))
  const newest = monthJournal[monthJournal.length - 1]

  return {
    prefix,
    capturedAt: dateKey(),
    title: ref.title,
    closing: ref.closing,
    lines: ref.lines,
    days,
    daysChecked,
    topMood,
    allKeptDays,
    habits,
    journalCount: monthJournal.length,
    excerpt: newest && newest.text && newest.text.trim() ? { at: newest.at, text: newest.text } : null,
  }
}

export function hasMonthRecord(prefix, { runs, checkins, journal = [] }) {
  if (Object.keys(checkins).some((k) => k.startsWith(prefix))) return true
  if (journal.some((e) => entryMonth(e) === prefix)) return true
  const endKey = monthEndKey(prefix)
  return Object.values(runs).some((run) => run && run.anchor <= endKey)
}

// Closed, recorded months (older than the current one, never the live month)
// that still lack a snapshot. Scans back from the earliest month that holds
// any record, so gap months and long absences are all covered.
export function missingSnapshots({ keepsakes, today, runs, checkins, journal = [] }) {
  const current = currentMonth(today)
  let earliest = null
  const consider = (prefix) => {
    if (prefix && prefix < current && (!earliest || prefix < earliest)) earliest = prefix
  }
  for (const k of Object.keys(checkins)) consider(k.slice(0, 7))
  for (const e of journal) consider(entryMonth(e))
  for (const run of Object.values(runs)) if (run && run.anchor) consider(run.anchor.slice(0, 7))
  if (!earliest) return []

  const out = []
  for (let p = earliest; p < current; p = shiftMonth(p, 1)) {
    if (!keepsakes[p] && hasMonthRecord(p, { runs, checkins, journal })) out.push(p)
  }
  return out
}
