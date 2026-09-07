import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HABIT_BY_ID } from '../data/habits.js'
import { MILESTONES, MILESTONE_BY_DAY, MOOD_BY_ID } from '../data/wisdom.js'
import { addDaysKey, bestOf, dateKey, dayLabel, nextMilestone, streakFor } from '../lib/streaks.js'
import { dayMood } from '../lib/checkins.js'
import { prefersReducedMotion, useCountUp } from '../lib/animate.js'
import { registerBackHandler } from '../lib/back.js'
import GrowthPlant from './GrowthStages.jsx'

function fmtAnchor(anchor) {
  const d = new Date(`${anchor}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// The last `n` local calendar days, oldest first, ending today.
function lastNDays(n, today) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDaysKey(today, -i))
  return days
}

// Full-screen detail for one habit. Opens with a shared-element-style morph
// from the card the user tapped (FLIP: measure the card, mount hidden, set
// the sheet's start transform from the delta, then play). Closing reverses
// the same transform, so the card "catches" the sheet on the way back.
//
// Lifecycle: 'enter' (mounted invisible, one layout pass to measure) →
// 'open' (morph in) → user closes → 'closing' (morph out) → onClose().
export default function HabitDetail({ habitId, fromRect, runs, checkins, today = dateKey(), onClose }) {
  const habit = HABIT_BY_ID[habitId]
  const run = runs[habitId]
  const cur = streakFor(run, today)
  const best = bestOf(run, today)
  const next = nextMilestone(cur)
  const touched = MILESTONE_BY_DAY[cur]
  const progress = next ? Math.min(1, cur / next.day) : 1

  const rootRef = useRef(null)
  const sheetRef = useRef(null)
  const [stage, setStage] = useState('enter')
  const count = useCountUp(cur)

  // FLIP setup: with the root still invisible, read the sheet's natural
  // resting rect and set custom properties that translate/scale it onto the
  // card's footprint. The next frame adds the animating classes.
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!fromRect || prefersReducedMotion() || !sheet) {
      setStage('open')
      return
    }
    const r = sheet.getBoundingClientRect()
    sheet.style.setProperty('--mx', `${Math.round(fromRect.left - r.left)}px`)
    sheet.style.setProperty('--my', `${Math.round(fromRect.top - r.top)}px`)
    sheet.style.setProperty('--ms', String(Math.min(1, fromRect.width / r.width)))
    requestAnimationFrame(() => setStage('open'))
  }, [fromRect])

  // Close: play the reverse morph, then hand control back to the parent to
  // unmount when the sheet has (visually) landed back on the card.
  const beginClose = () => {
    if (stage === 'closing') return
    setStage('closing')
  }

  useEffect(() => {
    if (stage !== 'open' && stage !== 'closing') return undefined
    // The layer is the whole screen: keep the page beneath from scrolling.
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') beginClose()
    }
    window.addEventListener('keydown', onKey)
    // Android hardware back closes this layer like a native screen.
    const dereg = registerBackHandler(beginClose)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      dereg()
    }
    // eslint-disable-next-line react-hooks/exhaustive-dep
  }, [stage === 'open' || stage === 'closing'])

  const onAnimationEnd = (e) => {
    if (stage === 'closing' && e.target === rootRef.current) onClose()
  }

  if (!habit) return null

  const days = lastNDays(14, today)
  const withinRun = (key) => run && key >= run.anchor && key <= today

  return (
    <div
      ref={rootRef}
      className={`habit-detail ${stage}`}
      data-habit={habitId}
      data-morph-target
      style={{ '--tint': habit.tint }}
      role="dialog"
      aria-label={`${habit.name} — full view`}
      onAnimationEnd={onAnimationEnd}
    >
      <button
        type="button"
        className="detail-close"
        aria-label="Close full view"
        onClick={beginClose}
      >
        ×
      </button>

      <div ref={sheetRef} className={`detail-sheet ${stage}`}>
        <div className="detail-hero">
          <GrowthPlant streak={cur} size={132} />
          {cur === 0 ? (
            <div className="detail-streak" style={{ fontSize: '1.6rem', lineHeight: 1.25 }}>
              A fresh start
              <span>begins the moment you choose it</span>
            </div>
          ) : (
            <div className="detail-streak">
              <span className="detail-num">{Math.round(count)}</span>
              <span className="detail-unit">{cur === 1 ? 'day going strong' : 'days going strong'}</span>
            </div>
          )}
          <p className="detail-since">
            {run?.anchor
              ? `This run began ${fmtAnchor(run.anchor)}${best > cur ? ` — your best is ${dayLabel(best)}` : ''}`
              : 'Ready when you are — day one begins with your next check-in'}
          </p>
        </div>

        {touched && (
          <p className="detail-milestone-note">
            🎉 <strong>Day {touched.day}</strong> — {touched.text}
          </p>
        )}

        {cur > 0 && (
          <section className="detail-section">
            <h4>The path ahead</h4>
            <div className="labels">
              <span>Day {cur}</span>
              <span>{next ? `Next: ${next.day} days` : 'Beyond every milestone 🌟'}</span>
            </div>
            <div className="track" role="presentation">
              <div className="fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <ul className="detail-ladder">
              {MILESTONES.map((m) => (
                <li key={m.day} className={m.day <= cur ? 'reached' : ''}>
                  <span className="rung" aria-hidden="true">
                    {m.day <= cur ? '✓' : ''}
                  </span>
                  <span className="rung-day">Day {m.day}</span>
                  <span className="rung-text">{m.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="detail-section">
          <h4>Your last 14 days</h4>
          <div className="detail-strip" role="img" aria-label="Moods and kept days of the last two weeks">
            {days.map((key) => {
              const mood = dayMood(checkins, key)
              return (
                <span key={key} className={`strip-day${withinRun(key) ? ' kept' : ''}`} title={key}>
                  {mood && MOOD_BY_ID[mood] ? MOOD_BY_ID[mood].emoji : ''}
                </span>
              )
            })}
          </div>
          <p className="mute" style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
            Filled days are days of this run · the small faces are your check-in moods
          </p>
        </section>

        <section className="detail-section">
          <p className="affirmation">“{habit.affirmation}”</p>
          <div className="note-box">
            <strong>When the urge comes:</strong> {habit.note}
          </div>
          <ul className="gentle-list">
            {habit.gentle.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
