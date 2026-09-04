import { useEffect, useRef, useState } from 'react'
import { HABIT_BY_ID } from '../data/habits.js'
import { MILESTONE_BY_DAY, MOOD_BY_ID } from '../data/wisdom.js'
import { dayMood } from '../lib/checkins.js'
import { reflectionText } from '../lib/reflection.js'
import { bestOf, dateKey, nextMilestone, streakFor } from '../lib/streaks.js'
import { drawMonthCard, drawStreakCard } from '../lib/cards.js'

function readAll() {
  const grab = (k, fb) => {
    try {
      const raw = localStorage.getItem(k)
      return raw != null ? JSON.parse(raw) : fb
    } catch {
      return fb
    }
  }
  return {
    picks: grab('nl.picks', []),
    runs: grab('nl.runs', {}),
    checkins: grab('nl.checkins', {}),
    journal: grab('nl.journal', []),
  }
}

function buildStreak(spec, today, runs) {
  const habit = HABIT_BY_ID[spec.habitId]
  const run = runs[spec.habitId]
  const days = streakFor(run, today)
  const best = bestOf(run, today)
  const message = days > 0
    ? MILESTONE_BY_DAY[days]
      ? `Day ${days} — ${MILESTONE_BY_DAY[days]}`
      : nextMilestone(days)
        ? `Next milestone: day ${nextMilestone(days).day}. One day at a time — you’re already doing it.`
        : 'You have gone all the way past the milestones. Quietly extraordinary.'
    : best > 0
      ? 'A fresh start begins the moment you choose it — and your best is kept safe.'
      : 'Day one starts the moment you choose it.'
  return {
    canvas: { name: habit.name, emoji: habit.emoji, tint: habit.tint, days, best, message },
    summary: `${habit.name}: ${days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} going strong` : best > 0 ? `your best ${best} days` : 'a fresh start'} — ${habit.emoji}`,
    filename: `new-leaf-${habit.id}-day-${Math.max(days, best)}.png`,
  }
}

function buildMonth(spec, today, { picks, runs, checkins, journal }, snap) {
  const prefix = spec.month
  const pad = (n) => String(n).padStart(2, '0')
  const [y, m] = prefix.split('-').map(Number)
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const monthLength = new Date(y, m, 0).getDate()
  const daysElapsed = prefix === today.slice(0, 7) ? Number(today.slice(8, 10)) : monthLength

  // A closed month preserved as a keepsake celebrates its frozen numbers —
  // what the month truly was, not what later slips leave of it.
  let checked
  let allKept
  let journalCount
  let topMood
  let closing
  if (snap) {
    checked = snap.daysChecked
    allKept = snap.allKeptDays
    journalCount = snap.journalCount
    topMood = snap.topMood || null
    closing = snap.closing || null
  } else {
    checked = 0
    allKept = 0
    const counts = {}
    for (let d = 1; d <= daysElapsed; d++) {
      const key = `${prefix}-${pad(d)}`
      if (key > today) break
      const mid = dayMood(checkins, key)
      if (mid && MOOD_BY_ID[mid]) {
        counts[mid] = (counts[mid] || 0) + 1
        checked += 1
      }
      const tracked = picks.filter((id) => {
        const run = runs[id]
        return run && key >= run.anchor
      })
      if (tracked.length && tracked.every((id) => streakFor(runs[id], key) >= 1)) allKept += 1
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    topMood = top ? MOOD_BY_ID[top[0]] : null
    journalCount = journal.filter((e) => {
      const d = new Date(e.at)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` === prefix
    }).length
    const ref = reflectionText({ today, picks, runs, checkins, monthKey: prefix, past: prefix < today.slice(0, 7) })
    closing = ref.closing || null
  }

  const rows = []
  rows.push({ emoji: '🗓️', label: `${checked} of ${daysElapsed} day${daysElapsed === 1 ? '' : 's'} checked in` })
  if (topMood) rows.push({ emoji: topMood.emoji, label: `${topMood.name} was the most felt mood` })
  if (allKept > 0) {
    rows.push({ emoji: '🌿', label: `${allKept} day${allKept === 1 ? '' : 's'} with every path kept` })
  }
  if (journalCount > 0) rows.push({ emoji: '✍️', label: `${journalCount} journal entr${journalCount === 1 ? 'y' : 'ies'} written` })
  if (!rows.length) rows.push({ emoji: '🌱', label: 'a quiet month — the record starts now' })

  return {
    canvas: { monthName, rows, closing },
    summary: rows.map((r) => r.label).join(' · '),
    filename: `new-leaf-${prefix}.png`,
  }
}

export default function CelebrateCard({ spec, keepsakes = {}, onClose }) {
  const canvasRef = useRef(null)
  const [{ picks, runs, checkins, journal }] = useState(readAll)
  const today = dateKey()
  const pastSnap =
    spec.kind === 'month' && spec.month < today.slice(0, 7) && keepsakes[spec.month]
      ? keepsakes[spec.month]
      : null
  const data =
    spec.kind === 'streak'
      ? buildStreak(spec, today, runs)
      : buildMonth(spec, today, { picks, runs, checkins, journal }, pastSnap)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (spec.kind === 'streak') drawStreakCard(canvas, data.canvas)
    else drawMonthCard(canvas, data.canvas)
  }, [spec, data])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    }, 'image/png')
  }

  const share = async () => {
    const canvas = canvasRef.current
    if (!canvas || typeof navigator.share !== 'function') return
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const file = new File([blob], data.filename, { type: 'image/png' })
    try {
      await navigator.share({ files: [file] })
    } catch {
      /* the visitor changed their mind — that's always fine */
    }
  }

  const title =
    spec.kind === 'streak'
      ? `A quiet card for ${HABIT_BY_ID[spec.habitId].name}`
      : 'A quiet card for your month'

  return (
    <div className="card-layer">
      <div className="celebrate">
        <div className="eyebrow" style={{ textAlign: 'center' }}>
          Celebrate quietly
        </div>
        <h2 style={{ textAlign: 'center' }}>{title}</h2>
        <p className="mute" style={{ textAlign: 'center', margin: '0 auto 14px', maxWidth: 480 }}>
          This card is drawn on your own device. Download it to keep, or share it with someone you trust — nothing is
          sent anywhere unless you choose to send it.
        </p>
        <div className="card-preview">
          <canvas ref={canvasRef} width="1080" height="1080" aria-label={title} />
          <p className="sr-summary">{data.summary}</p>
        </div>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={download}>
            Download PNG
          </button>
          <button type="button" className="btn btn-ghost" onClick={share}>
            Share…
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
