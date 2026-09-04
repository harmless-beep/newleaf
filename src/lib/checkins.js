import { MOOD_BY_ID } from '../data/wisdom.js'

// A day's check-in record is stored as { morning?: moodId, evening?: moodId }.
// Older records hold a bare moodId string meaning "the morning mood", so the
// readers below accept both shapes — nothing an existing user recorded is
// ever lost or misread.

export function moodOf(checkins, key, slot) {
  const value = checkins?.[key]
  if (!value) return null
  if (typeof value === 'string') return slot === 'morning' ? (MOOD_BY_ID[value] ? value : null) : null
  const id = value[slot]
  return id && MOOD_BY_ID[id] ? id : null
}

// Day-level mood (the one shown in journeys): morning when present,
// otherwise evening — never both, so a day is still counted once.
export function dayMood(checkins, key) {
  return moodOf(checkins, key, 'morning') || moodOf(checkins, key, 'evening')
}

export function setMood(checkins, key, slot, moodId) {
  const prev = checkins[key]
  const base =
    prev && typeof prev === 'object'
      ? { ...prev }
      : prev && typeof prev === 'string' && MOOD_BY_ID[prev]
        ? { morning: prev }
        : {}
  return { ...checkins, [key]: { ...base, [slot]: moodId } }
}
