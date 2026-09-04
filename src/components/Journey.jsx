import { useState } from 'react'
import { HABIT_BY_ID, HABITS } from '../data/habits.js'
const HABIT_IDS = HABITS.map((h) => h.id)
import { MILESTONE_BY_DAY } from '../data/wisdom.js'
import { bestOf, dateKey, dayLabel, milestoneTouchedToday, nextMilestone, streakFor } from '../lib/streaks.js'
import HabitPicker from './HabitPicker.jsx'

function fmtAnchor(anchor) {
  const d = new Date(`${anchor}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Journey({ picks, runs, addHabit, removeHabit, slipHabit }) {
  const [confirm, setConfirm] = useState(null) // { id, type: 'slip' | 'remove' }
  const today = dateKey()

  if (picks.length === 0) {
    return (
      <div className="fade-in" style={{ marginTop: 26 }}>
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
