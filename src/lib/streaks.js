import { MILESTONES } from '../data/wisdom.js'

const pad = (n) => String(n).padStart(2, '0')

// Local calendar date as YYYY-MM-DD (not UTC, so a new day starts at local midnight).
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayKey() {
  return dateKey()
}

export function addDaysKey(key, n) {
  const d = new Date(`${key}T00:00:00`)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

// Whole days from aKey to bKey (bKey assumed >= aKey, same local calendar).
export function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T00:00:00`)
  const b = new Date(`${bKey}T00:00:00`)
  return Math.round((b - a) / 86400000)
}

// A "run" is { anchor: 'YYYY-MM-DD', best: number }.
// anchor = the day the current streak began (or the day of a slip).
// The current streak counts the anchor day too: slip today => 1 day going strong.
export function streakFor(run, today = todayKey()) {
  if (!run) return 0
  const diff = daysBetween(run.anchor, today)
  return Math.max(0, diff + 1)
}

export function bestOf(run, today = todayKey()) {
  return Math.max(run?.best || 0, streakFor(run, today))
}

// Smallest milestone strictly greater than current (or null if past them all).
export function nextMilestone(current) {
  return MILESTONES.find((m) => m.day > current) ?? null
}

// The milestone whose day equals `current`, if any (used to celebrate today).
export function milestoneTouchedToday(current) {
  return MILESTONES.find((m) => m.day === current) ?? null
}

export const dayLabel = (n) => (n === 1 ? '1 day' : `${n} days`)
