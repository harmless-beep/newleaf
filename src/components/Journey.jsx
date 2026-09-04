import { useState } from 'react'
import { HABIT_BY_ID, HABITS } from '../data/habits.js'
const HABIT_IDS = HABITS.map((h) => h.id)
import { MILESTONE_BY_DAY, MOOD_BY_ID } from '../data/wisdom.js'
import { addDaysKey, bestOf, dateKey, dayLabel, daysBetween, milestoneTouchedToday, nextMilestone, streakFor } from '../lib/streaks.js'
import HabitPicker from './HabitPicker.jsx'

function fmtAnchor(anchor) {
  const d = new Date(`${anchor}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// A gentle look back at the current month: checked-in moods beside the
// days each path was kept. Because a run's anchor only moves on a slip,
// every day from the anchor (or the month's start) to today really was
// kept — the card only ever says what the record actually shows.
function Reflection({ today, picks, runs, checkins }) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  const startKey = `${prefix}-01`
  const monthName = now.toLocaleDateString(undefined, { month: 'long' })

  const monthEntries = Object.entries(checkins).filter(([k]) => k.startsWith(prefix) && k <= today)
  const counts = {}
  for (const [, id] of monthEntries) {
    if (MOOD_BY_ID[id]) counts[id] = (counts[id] || 0) + 1
  }

  const lines = []
  if (monthEntries.length > 0) {
    const [topId, topN] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    const top = MOOD_BY_ID[topId]
    const total = monthEntries.length
    lines.push(
      topN / total >= 0.45
        ? `${top.emoji} ${top.name} was your most common feeling this month — on ${topN} of the ${total} day${total === 1 ? '' : 's'} you checked in.`
        : `Your ${total} check-in${total === 1 ? '' : 's'} spread across moods; ${top.emoji} ${top.name.toLowerCase()} led with ${topN}.`
    )
    if (counts.heavy) {
      lines.push('Heavy days were part of this month — and you kept choosing yourself through them. That counts for more than any streak.')
    }
    if (counts.restless) {
      lines.push('Restless days rose too, and each one passed. You outlasted every wave.')
    }
  }

  for (const id of picks) {
    const run = runs[id]
    if (!run || run.anchor > today) continue
    const from = run.anchor > startKey ? run.anchor : startKey
    const habit = HABIT_BY_ID[id]
    lines.push(
      from === startKey
        ? `${habit.emoji} ${habit.name} — kept every day of ${monthName} so far.`
        : `${habit.emoji} ${habit.name} — going strong for ${dayLabel(daysBetween(from, today) + 1)}, starting ${new Date(`${from}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
    )
  }

  if (lines.length === 0) return null

  const closing = counts.heavy
    ? 'A month with heavy days in it is still a month you lived through. Be proud of surviving it, and kind about the rest.'
    : 'No month is the whole story. Whatever this one has held so far, it brought you here.'

  return (
    <section className="card reflection">
      <div className="eyebrow">Reflection</div>
      <h3>Your {monthName}, gently</h3>
      <ul className="reflect-list">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="close">{closing}</p>
    </section>
  )
}

// What the record truly shows for one day: the checked-in mood, and how many
// of that day's active paths were kept. Days before a path began — and days
// still ahead — read as “—” rather than guessing.
function dayCell(key, today, picks, runs, checkins) {
  if (key > today) return { mood: null, kept: 0, tracked: 0 }
  const tracked = picks.filter((id) => {
    const run = runs[id]
    return run && key >= run.anchor
  })
  const kept = tracked.filter((id) => streakFor(runs[id], key) >= 1).length
  const mood = checkins[key] ? MOOD_BY_ID[checkins[key]] : null
  return { mood, kept, tracked: tracked.length }
}

const keptMark = (kept, tracked) =>
  tracked === 0 ? (
    <span className="miss">—</span>
  ) : kept === tracked ? (
    '✓'
  ) : (
    <span className="miss">
      {kept}/{tracked}
    </span>
  )

export default function Journey({ picks, runs, checkins, stripView = 'week', setStripView = () => {}, addHabit, removeHabit, slipHabit }) {
  const [confirm, setConfirm] = useState(null) // { id, type: 'slip' | 'remove' }
  const today = dateKey()

  const pad = (n) => String(n).padStart(2, '0')
  const cellFor = (key) => dayCell(key, today, picks, runs, checkins)
  const describe = (c) =>
    c.mood
      ? `${c.mood.name}${c.tracked ? (c.kept === c.tracked ? ', all paths kept' : `, kept ${c.kept} of ${c.tracked}`) : ''}`
      : 'no check-in'

  // This week: each day's mood (if checked in) beside how many of that day's
  // chosen paths were kept. Days before a habit began show as “—”.
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysKey(today, i - 6)
    const d = new Date(`${key}T00:00:00`)
    const c = cellFor(key)
    return {
      key,
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      date: d.getDate(),
      mood: c.mood,
      kept: c.kept,
      tracked: c.tracked,
      label: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${describe(c)}`,
    }
  })

  // This calendar month (Monday-first) for the expandable view.
  const [year, monthNum] = today.split('-').map(Number)
  const monthPrefix = `${year}-${pad(monthNum)}`
  const monthName = new Date(year, monthNum - 1, 1).toLocaleDateString(undefined, { month: 'long' })
  const lastDate = new Date(year, monthNum, 0).getDate()
  const leadBlanks = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7
  const month = []
  for (let b = 0; b < leadBlanks; b++) month.push({ blank: true })
  for (let d = 1; d <= lastDate; d++) {
    const key = `${monthPrefix}-${pad(d)}`
    const c = cellFor(key)
    const dt = new Date(`${key}T00:00:00`)
    const future = key > today
    month.push({
      key,
      date: d,
      future,
      weekend: dt.getDay() === 0 || dt.getDay() === 6,
      mood: c.mood,
      kept: c.kept,
      tracked: c.tracked,
      label: future ? `${monthName} ${d} — not here yet` : `${monthName} ${d}: ${describe(c)}`,
    })
  }

  if (picks.length === 0) {
    return (
      <div className="fade-in" style={{ marginTop: 26 }}>
        <Reflection today={today} picks={picks} runs={runs} checkins={checkins} />
        <section className="card">
          <div className="eyebrow">Your journey</div>
          <h2>A path begins with a single step — choose yours</h2>
          <p>
            Pick one or more things you’d like to soften. There’s no hurry and no judgment: you can start with one,
            add more later, or change your mind whenever you like.
          </p>
          <HabitPicker value={picks} onToggle={addHabit} />
        </section>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ marginTop: 26 }}>
      <section className="hero" style={{ marginBottom: 18 }}>
        <h1>My journey</h1>
        <p className="sub">
          This isn’t about perfection — it’s about showing up. Every card below is simply a record of your choosing,
          day by day.
        </p>
      </section>

      <section className="card">
        <div className="strip-head">
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            {stripView === 'week' ? 'Your last seven days' : `${monthName} at a glance`}
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => setStripView(stripView === 'week' ? 'month' : 'week')}
          >
            {stripView === 'week' ? 'See the whole month →' : '← Back to this week'}
          </button>
        </div>
        <p className="mute" style={{ margin: '2px 0 0' }}>
          How you felt each morning, beside how your paths went. Just a record — not a grade.
        </p>

        {stripView === 'week' ? (
          <>
            <div className="week-strip" role="list" aria-label="Last seven days of moods and kept habits">
              {week.map((w) => (
                <div key={w.key} className={`week-cell${w.key === today ? ' today' : ''}`} role="listitem" aria-label={w.label}>
                  <span className="week-day">{w.day}</span>
                  <span className="week-date">{w.date}</span>
                  <span className={`week-mood${w.mood ? '' : ' empty'}`} aria-hidden="true">
                    {w.mood ? w.mood.emoji : '·'}
                  </span>
                  <span className="week-kept">{keptMark(w.kept, w.tracked)}</span>
                </div>
              ))}
            </div>
            <p className="mute" style={{ margin: '10px 0 0' }}>
              <b>✓</b> every path kept · like <b>2/3</b> some kept · <b>—</b> hadn’t begun yet · a dim dot is a day
              without a check-in
            </p>
          </>
        ) : (
          <>
            <div className="month-grid" role="grid" aria-label={`${monthName} moods and kept habits`}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
                <div key={w} className="month-head" role="columnheader">
                  {w}
                </div>
              ))}
              {month.map((c, i) =>
                c.blank ? (
                  <div key={`blank-${i}`} className="month-cell blank" aria-hidden="true" />
                ) : (
                  <div
                    key={c.key}
                    role="gridcell"
                    aria-label={c.label}
                    className={`month-cell${c.future ? ' future' : ''}${c.weekend && !c.future ? ' weekend' : ''}${c.key === today ? ' today' : ''}`}
                  >
                    <span className="month-day">{c.date}</span>
                    <span className={`week-mood${c.mood ? '' : ' empty'}`} aria-hidden="true">
                      {c.mood ? c.mood.emoji : '·'}
                    </span>
                    <span className="week-kept">{c.future ? <span className="miss" /> : keptMark(c.kept, c.tracked)}</span>
                  </div>
                )
              )}
            </div>
            <p className="mute" style={{ margin: '10px 0 0' }}>
              <b>✓</b> every path kept · like <b>2/3</b> some kept · <b>—</b> no active path that day · dim days
              weren’t checked in · faded days are still ahead
            </p>
          </>
        )}
      </section>

      <Reflection today={today} picks={picks} runs={runs} checkins={checkins} />

      {picks.map((id) => {
        const habit = HABIT_BY_ID[id]
        const run = runs[id]
        const cur = streakFor(run, today)
        const best = bestOf(run, today)
        const next = nextMilestone(cur)
        const touched = milestoneTouchedToday(cur)
        const progress = next ? Math.min(1, cur / next.day) : 1
        const confirming = confirm && confirm.id === id

        return (
          <section key={id} className="card habit-card" style={{ '--tint': habit.tint }}>
            <div className="habit-head">
              <div className="habit-icon" aria-hidden="true">
                {habit.emoji}
              </div>
              <div className="habit-title">
                <h3>{habit.name}</h3>
                <div className="since">
                  {run?.anchor ? `current run began ${fmtAnchor(run.anchor)}` : 'ready when you are'}
                </div>
              </div>
            </div>

            <div className="streak-row">
              {cur === 0 ? (
                <div className="streak-big" style={{ fontSize: '1.7rem', lineHeight: 1.2 }}>
                  A fresh start
                  <span style={{ display: 'block', fontSize: '0.95rem' }}>
                    begins the moment you choose it
                  </span>
                </div>
              ) : (
                <div className="streak-big">
                  {cur}
                  <span>{cur === 1 ? 'day' : 'days'} going strong</span>
                </div>
              )}
              {best > 0 && <span className="best-tag">your best: {dayLabel(best)}</span>}
            </div>

            {cur > 0 && (
              <div className="milestone-track">
                <div className="labels">
                  <span>Day {cur}</span>
                  <span>{next ? `Next: ${next.day} days` : 'Beyond the milestones 🌟'}</span>
                </div>
                <div className="track" role="presentation">
                  <div className="fill" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}

            {touched && (
              <p className="celebration" style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                🎉 <strong>{habit.emoji} Day {touched.day}</strong> — {MILESTONE_BY_DAY[touched.day]}
              </p>
            )}

            <p className="affirmation">“{habit.affirmation}”</p>

            <div className="note-box">
              <strong>When the urge comes:</strong> {habit.note}
            </div>

            <details className="gentle-more">
              <summary>Small steps that help</summary>
              <ul className="gentle-list">
                {habit.gentle.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </details>

            {confirming && confirm.type === 'slip' ? (
              <div className="confirm-box" role="alertdialog" aria-label="Confirm a slip">
                Slips happen to everyone — they’re part of the path, not the end of it. This gently resets your current
                count (your best is kept). What matters is that you’re here, being honest. That’s strength.
                <div className="btn-row">
                  <button type="button" className="btn btn-primary" onClick={() => { slipHabit(id); setConfirm(null) }}>
                    I slipped — I’m starting again
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
                    I’m still going
                  </button>
                </div>
              </div>
            ) : confirming && confirm.type === 'remove' ? (
              <div className="confirm-box" role="alertdialog" aria-label="Remove habit">
                This only removes <strong>{habit.name}</strong> from your list — your history and best are kept safe,
                and you can add it back anytime.
                <div className="btn-row">
                  <button type="button" className="btn btn-danger" onClick={() => { removeHabit(id); setConfirm(null) }}>
                    Remove from my journey
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <div className="habit-actions">
                <button type="button" className="btn btn-soft" onClick={() => setConfirm({ id, type: 'slip' })}>
                  I slipped today
                </button>
                <button type="button" className="text-link" onClick={() => setConfirm({ id, type: 'remove' })}>
                  remove from my journey
                </button>
              </div>
            )}
          </section>
        )
      })}

      <section className="card soft">
        <div className="eyebrow">Add another to your journey</div>
        {picks.length < 7 ? (
          <HabitPicker
            value={[]}
            available={HABIT_IDS.filter((id) => !picks.includes(id))}
            onToggle={addHabit}
          />
        ) : (
          <p className="mute" style={{ marginBottom: 0 }}>
            You’re working on all of them — that is a lot of quiet courage. Be gentle with yourself about pace.
          </p>
        )}
      </section>
    </div>
  )
}
