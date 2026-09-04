import { useState } from 'react'
import { HABIT_BY_ID, HABITS } from '../data/habits.js'
const HABIT_IDS = HABITS.map((h) => h.id)
import { MILESTONE_BY_DAY, MOOD_BY_ID } from '../data/wisdom.js'
import { addDaysKey, bestOf, dateKey, dayLabel, daysBetween, milestoneTouchedToday, nextMilestone, streakFor } from '../lib/streaks.js'
import { dayMood, moodOf } from '../lib/checkins.js'
import HabitPicker from './HabitPicker.jsx'

function fmtAnchor(anchor) {
  const d = new Date(`${anchor}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// A gentle look back at one month (defaulting to the current one): checked-in
// moods beside the days each path was kept. Because a run's anchor only moves
// on a slip, days from the anchor (or the month's start) are genuinely kept —
// and when a run began after a past month ended, the card says nothing about
// that month rather than guessing.
function Reflection({ today, picks, runs, checkins, monthKey, past }) {
  const pad = (n) => String(n).padStart(2, '0')
  const [y, m] = monthKey.split('-').map(Number)
  const startKey = `${monthKey}-01`
  const endKey = `${monthKey}-${pad(new Date(y, m, 0).getDate())}`
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long' })

  // A day counts once: its morning mood, or its evening mood when only that exists.
  const monthKeys = Object.keys(checkins).filter((k) => k.startsWith(monthKey) && k <= today && k <= endKey)
  const counts = {}
  let heavyDays = 0
  let restlessDays = 0
  for (const k of monthKeys) {
    const m = dayMood(checkins, k)
    if (m && MOOD_BY_ID[m]) counts[m] = (counts[m] || 0) + 1
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
      const m = moodOf(checkins, k, 'morning')
      const e = moodOf(checkins, k, 'evening')
      if (!m || !e) continue
      paired += 1
      if (isLight(m) && !isLight(e)) dip += 1
      else if (!isLight(m) && isLight(e)) rise += 1
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
          : `${habit.emoji} ${habit.name} — kept ${dayLabel(daysBetween(from, endKey) + 1)} that month, from ${fmtAnchor(from)}.`
      )
    } else {
      lines.push(
        run.anchor <= startKey
          ? `${habit.emoji} ${habit.name} — kept every day of ${monthName} so far.`
          : `${habit.emoji} ${habit.name} — going strong for ${dayLabel(daysBetween(from, today) + 1)}, starting ${fmtAnchor(from)}.`
      )
    }
  }

  if (lines.length === 0) return null

  const closing = past
    ? heavyDays > 0
      ? 'A month with heavy days in it is still a month you lived through. Be proud of surviving it, and kind about the rest.'
      : `No single month is the whole story. ${monthName} held what it held — and it brought you here.`
    : heavyDays > 0
      ? 'A month with heavy days in it is still a month you lived through. Be proud of surviving it, and kind about the rest.'
      : 'No month is the whole story. Whatever this one has held so far, it brought you here.'

  return (
    <section className="card reflection">
      <div className="eyebrow">Reflection</div>
      <h3>
        Your {monthName}, {past ? 'looking back' : 'gently'}
      </h3>
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
  const mid = dayMood(checkins, key) // morning, falling back to evening
  return { mood: mid ? MOOD_BY_ID[mid] : null, kept, tracked: tracked.length }
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

export default function Journey({ picks, runs, checkins, stripView = 'week', setStripView = () => {}, journeyMonth = null, setJourneyMonth = () => {}, addHabit, removeHabit, slipHabit }) {
  const [confirm, setConfirm] = useState(null) // { id, type: 'slip' | 'remove' }
  const today = dateKey()
  const currentPrefix = today.slice(0, 7)

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

  // The calendar month on display (Monday-first), defaulting to the current
  // one; the ‹ › controls step back through history and forward again.
  const inMonthView = stripView === 'month'
  const viewPrefix = inMonthView ? journeyMonth || currentPrefix : currentPrefix
  const [vYear, vMonth] = viewPrefix.split('-').map(Number)
  const viewName = new Date(vYear, vMonth - 1, 1).toLocaleDateString(undefined, { month: 'long' })
  const viewPast = viewPrefix < currentPrefix
  const viewLast = new Date(vYear, vMonth, 0).getDate()
  const leadBlanks = (new Date(vYear, vMonth - 1, 1).getDay() + 6) % 7
  const month = []
  for (let b = 0; b < leadBlanks; b++) month.push({ blank: true })
  for (let d = 1; d <= viewLast; d++) {
    const key = `${viewPrefix}-${pad(d)}`
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
      label: future ? `${viewName} ${d} — not here yet` : `${viewName} ${d}: ${describe(c)}`,
    })
  }
  const goMonth = (delta) => {
    const d = new Date(vYear, vMonth - 1 + delta, 1)
    setJourneyMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }
  const backToWeek = () => {
    setStripView('week')
    setJourneyMonth(null)
  }

  if (picks.length === 0) {
    return (
      <div className="fade-in" style={{ marginTop: 26 }}>
        <Reflection today={today} picks={picks} runs={runs} checkins={checkins} monthKey={currentPrefix} past={false} />
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
            {stripView === 'week' ? 'Your last seven days' : `${viewName} at a glance`}
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => (stripView === 'week' ? setStripView('month') : backToWeek())}
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
            <div className="month-nav" role="group" aria-label="Browse months">
              <button
                type="button"
                className="text-link"
                aria-label="Previous month"
                onClick={() => goMonth(-1)}
              >
                ‹ {new Date(vYear, vMonth - 2, 1).toLocaleDateString(undefined, { month: 'short' })}
              </button>
              <span className="month-now">
                {viewName} {vYear}
              </span>
              <button
                type="button"
                className="text-link"
                aria-label="Next month"
                disabled={!viewPast}
                onClick={() => goMonth(1)}
              >
                {new Date(vYear, vMonth, 1).toLocaleDateString(undefined, { month: 'short' })} ›
              </button>
            </div>
            <div className="month-grid" role="grid" aria-label={`${viewName} moods and kept habits`}>
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

      <Reflection today={today} picks={picks} runs={runs} checkins={checkins} monthKey={viewPrefix} past={viewPast} />

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
