import { HABIT_BY_ID } from '../data/habits.js'
import { MOOD_BY_ID } from '../data/wisdom.js'
import { dayMood, moodOf } from './checkins.js'
import { dayLabel, daysBetween } from './streaks.js'

// The reflection for one month (defaults handled by the caller): checked-in
// moods beside the days each path was kept. Because a run's anchor only moves
// on a slip, days from the anchor (or the month's start) are genuinely kept —
// and when a run began after a past month ended, the card says nothing about
// that month rather than guessing. Keepsake export and the Journey card share
// this so they can never drift apart.
export function reflectionText({ today, picks, runs, checkins, monthKey, past }) {
  const pad = (n) => String(n).padStart(2, '0')
  const [y, m] = monthKey.split('-').map(Number)
  const startKey = `${monthKey}-01`
  const endKey = `${monthKey}-${pad(new Date(y, m, 0).getDate())}`
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long' })
  const fmt = (key) => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  // A day counts once: its morning mood, or its evening mood when only that exists.
  const monthKeys = Object.keys(checkins).filter((k) => k.startsWith(monthKey) && k <= today && k <= endKey)
  const counts = {}
  let heavyDays = 0
  let restlessDays = 0
  for (const k of monthKeys) {
    const day = dayMood(checkins, k)
    if (day && MOOD_BY_ID[day]) counts[day] = (counts[day] || 0) + 1
    if (moodOf(checkins, k, 'morning') === 'heavy' || moodOf(checkins, k, 'evening') === 'heavy') heavyDays += 1
    if (moodOf(checkins, k, 'morning') === 'restless' || moodOf(checkins, k, 'evening') === 'restless') restlessDays += 1
  }

  const lines = []
  if (monthKeys.length > 0) {
    const [topId, topN] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    const top = MOOD_BY_ID[topId]
    const total = monthKeys.length
    const plural = total === 1 ? 'day' : 'days'
    lines.push(
      past
        ? topN / total >= 0.45
          ? `In ${monthName}, ${top.emoji} ${top.name} was your most common feeling — on ${topN} of ${total} ${plural} you checked in.`
          : `Your ${total} check-in${total === 1 ? '' : 's'} that month spread across moods; ${top.emoji} ${top.name.toLowerCase()} led with ${topN}.`
        : topN / total >= 0.45
          ? `${top.emoji} ${top.name} was your most common feeling this month — on ${topN} of the ${total} ${plural} you checked in.`
          : `Your ${total} check-in${total === 1 ? '' : 's'} spread across moods; ${top.emoji} ${top.name.toLowerCase()} led with ${topN}.`
    )
    if (heavyDays > 0) {
      lines.push(
        past
          ? 'Heavy days were part of that month too — and you kept going. That counts for more than any streak.'
          : 'Heavy days were part of this month — and you kept choosing yourself through them. That counts for more than any streak.'
      )
    }
    if (restlessDays > 0) {
      lines.push(
        past
          ? 'Restless days came and went that month — and each wave passed.'
          : 'Restless days rose too, and each one passed. You outlasted every wave.'
      )
    }

    // Morning-vs-evening shifts, only where both were honestly recorded.
    const isLight = (id) => id === 'bright' || id === 'steady' || id === 'quiet'
    let paired = 0
    let dip = 0
    let rise = 0
    for (const k of monthKeys) {
      const mor = moodOf(checkins, k, 'morning')
      const eve = moodOf(checkins, k, 'evening')
      if (!mor || !eve) continue
      paired += 1
      if (isLight(mor) && !isLight(eve)) dip += 1
      else if (!isLight(mor) && isLight(eve)) rise += 1
    }
    if (paired >= 3) {
      if (dip >= 2 && dip >= rise) {
        lines.push(
          `On ${dip} of ${paired} fully checked-in days you started lighter and ended restless or heavy — a quiet pattern worth noticing. It’s information, not failure: something in those days may be asking for care.`
        )
      } else if (rise >= 2 && rise > dip) {
        lines.push(
          `On ${rise} of ${paired} fully checked-in days you started restless or heavy and ended lighter — something in the day turned things around. Worth remembering.`
        )
      }
    }
  }

  for (const id of picks) {
    const run = runs[id]
    // A run that began after this month ended can't vouch for it — stay silent.
    if (!run || run.anchor > today || run.anchor > endKey) continue
    const from = run.anchor > startKey ? run.anchor : startKey
    const habit = HABIT_BY_ID[id]
    if (past) {
      lines.push(
        run.anchor <= startKey
          ? `${habit.emoji} ${habit.name} — kept every day of ${monthName}.`
          : `${habit.emoji} ${habit.name} — kept ${dayLabel(daysBetween(from, endKey) + 1)} that month, from ${fmt(from)}.`
      )
    } else {
      lines.push(
        run.anchor <= startKey
          ? `${habit.emoji} ${habit.name} — kept every day of ${monthName} so far.`
          : `${habit.emoji} ${habit.name} — going strong for ${dayLabel(daysBetween(from, today) + 1)}, starting ${fmt(from)}.`
      )
    }
  }

  const closing = past
    ? heavyDays > 0
      ? 'A month with heavy days in it is still a month you lived through. Be proud of surviving it, and kind about the rest.'
      : `No single month is the whole story. ${monthName} held what it held — and it brought you here.`
    : heavyDays > 0
      ? 'A month with heavy days in it is still a month you lived through. Be proud of surviving it, and kind about the rest.'
      : 'No month is the whole story. Whatever this one has held so far, it brought you here.'

  return {
    title: `Your ${monthName}, ${past ? 'looking back' : 'gently'}`,
    monthName,
    lines,
    closing,
    heavyDays,
  }
}
