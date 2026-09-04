import { useEffect, useState } from 'react'
import { DAILIES, EVENING_REPLY, MOODS, MOOD_BY_ID, WIND_DOWN } from '../data/wisdom.js'
import { HABIT_BY_ID } from '../data/habits.js'
import { moodOf, setMood } from '../lib/checkins.js'
import { addDaysKey, bestOf, dateKey, dayLabel, milestoneTouchedToday, streakFor } from '../lib/streaks.js'
import { nativeTick } from '../lib/native.js'
import HabitPicker from './HabitPicker.jsx'

function dailyIndex(key) {
  const [y, m, d] = key.split('-').map(Number)
  const doy = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1
  return (y * 1000 + doy) % DAILIES.length
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return { word: 'Still up?', note: 'The quiet hours are hard. Be extra gentle with yourself.' }
  if (h < 12) return { word: 'Good morning', note: 'A fresh day is a quiet gift. Here is a note for it.' }
  if (h < 17) return { word: 'Good afternoon', note: 'However the day has gone so far — this moment is new.' }
  return { word: 'Good evening', note: 'You made it through another day of choosing yourself. That matters.' }
}

const TOOLS = [
  { id: 'breathe', label: '🌬 Breathe', when: 'heart racing, mind loud' },
  { id: 'ground', label: '🌍 Ground myself', when: 'spinning, far away' },
  { id: 'ride', label: '🌊 Ride it out', when: 'the urge is peaking' },
  { id: 'journal', label: '✍️ Write it out', when: 'something needs saying' },
]

function MoodButtons({ onPick, label }) {
  return (
    <div className="mood-grid" role="group" aria-label={label}>
      {MOODS.map((m) => (
        <button
          key={m.id}
          type="button"
          className="mood"
          onClick={() => {
            nativeTick() // a soft native tap inside the Android app
            onPick(m.id)
          }}
        >
          <span aria-hidden="true">{m.emoji}</span>
          {m.name}
        </button>
      ))}
    </div>
  )
}

// One or two gentle check-ins per day: a morning ask (“how are you feeling?”)
// and an optional evening one (“how did the day actually go?”) that shows once
// the day is closing — especially when the morning one was skipped.
function CheckIn({ checkins, setCheckins, dayKey, steps = {}, setSteps = () => {} }) {
  const hour = new Date().getHours()
  const eveningTime = hour >= 19
  const morning = moodOf(checkins, dayKey, 'morning')
  const evening = moodOf(checkins, dayKey, 'evening')
  const morningMood = morning ? MOOD_BY_ID[morning] : null
  const eveningMood = evening ? MOOD_BY_ID[evening] : null
  const tomorrowKey = addDaysKey(dayKey, 1)
  const tomorrowStep = steps[tomorrowKey] || ''
  const [draft, setDraft] = useState('')
  useEffect(() => {
    // If a step was set for tomorrow, show it so it can be changed tonight.
    setDraft((d) => (tomorrowStep && d === '' ? tomorrowStep : d))
  }, [tomorrowStep])
  const windLine = WIND_DOWN[Number(dayKey.replaceAll('-', '')) % WIND_DOWN.length]
  const saveStep = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setSteps({ ...steps, [tomorrowKey]: trimmed })
  }

  // The evening ask — optional, un-pushy, shown once the day is closing.
  if (eveningTime && !evening) {
    return (
      <section className="card checkin checkin-evening" aria-live="polite">
        <div className="eyebrow">Evening check-in</div>
        <h2>
          {morningMood ? 'How did today actually go?' : 'Morning slipped by — how did today actually go?'}
        </h2>
        {morningMood && (
          <p className="mute" style={{ margin: 0 }}>
            This morning you felt {morningMood.name.toLowerCase()}. The day may have changed that — either way is
            welcome.
          </p>
        )}
        <p className="mute" style={{ margin: '10px 0 0' }}>
          Optional — one tap, no pressure. Skip it and tomorrow starts fresh either way.
        </p>
        <MoodButtons onPick={(id) => setCheckins(setMood(checkins, dayKey, 'evening', id))} label="Choose how your day went" />
      </section>
    )
  }

  // No check-in at all yet and the day isn’t closing — the morning ask.
  if (!morning && !evening) {
    return (
      <section className="card checkin">
        <div className="eyebrow">Morning check-in</div>
        <h2>How are you feeling today?</h2>
        <p className="mute" style={{ margin: 0 }}>
          One tap. There’s no wrong answer — this is just a gentle way to notice yourself.
        </p>
        <MoodButtons onPick={(id) => setCheckins(setMood(checkins, dayKey, 'morning', id))} label="Choose how you feel" />
      </section>
    )
  }

  // Both slots recorded — the day is bookended, quietly.
  if (evening) {
    return (
      <section className="card checkin" aria-live="polite">
        <div className="eyebrow">Your check-ins today</div>
        <div className="checkin-done">
          <span className="big" aria-hidden="true">
            {eveningMood.emoji}
          </span>
          <div>
            <h2>Ending {eveningMood.name.toLowerCase()}</h2>
            <p>{EVENING_REPLY[eveningMood.id]}</p>
            {morningMood && (
              <p className="mute" style={{ margin: '6px 0 0' }}>
                Started {morningMood.name.toLowerCase()} {morningMood.emoji}
              </p>
            )}
          </div>
        </div>

        {eveningTime && (
          <div className="wind-down">
            <p className="wind-line">{windLine}</p>
            <label className="wind-label" htmlFor="step-input">
              Want to set one small step for tomorrow?
            </label>
            <div className="wind-row">
              <input
                id="step-input"
                type="text"
                maxLength={140}
                className="step-input"
                placeholder="e.g. two minutes of fresh air before the screen"
                aria-label="Tomorrow’s one small step"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!draft.trim()}
                onClick={saveStep}
              >
                {tomorrowStep ? 'Update step' : 'Keep it for tomorrow'}
              </button>
            </div>
            {tomorrowStep && (
              <p className="mute" style={{ margin: '8px 0 0' }}>
                ✓ Tomorrow’s step is set — you can change it anytime tonight.
              </p>
            )}
          </div>
        )}
      </section>
    )
  }

  // Morning only, day still open.
  return (
    <section className="card checkin" aria-live="polite">
      <div className="eyebrow">Your check-in today</div>
      <div className="checkin-done">
        <span className="big" aria-hidden="true">
          {morningMood.emoji}
        </span>
        <div>
          <h2>Feeling {morningMood.name.toLowerCase()} today</h2>
          <p>{morningMood.reply}</p>
        </div>
      </div>
      <p className="mute" style={{ margin: '12px 0 0' }}>
        Thank you for checking in. Tomorrow is a new check-in — however you feel then is welcome too.
      </p>
    </section>
  )
}

export default function Today({ picks, runs, checkins, setCheckins, steps = {}, setSteps = () => {}, addHabit, removeHabit, onGo }) {
  const greet = greeting()
  const key = dateKey()

  const message = DAILIES[dailyIndex(key)]

  const celebrations = picks
    .map((id) => {
      const run = runs[id]
      const streak = streakFor(run, key)
      const ms = milestoneTouchedToday(streak)
      return ms ? { habit: HABIT_BY_ID[id], text: ms.text } : null
    })
    .filter(Boolean)

  const working = picks.map((id) => {
    const habit = HABIT_BY_ID[id]
    const run = runs[id]
    const cur = streakFor(run, key)
    const best = bestOf(run, key)
    return { habit, cur, best }
  })

  return (
    <div className="fade-in">
      <section className="hero" style={{ margin: '26px 0 18px' }}>
        <h1>
          {greet.word} <span aria-hidden="true">☀️</span>
        </h1>
        <p className="sub">{greet.note}</p>
      </section>

      <CheckIn checkins={checkins} setCheckins={setCheckins} dayKey={key} steps={steps} setSteps={setSteps} />

      {steps[key] && (
        <section className="card step-card">
          <div className="eyebrow">Your one small step today</div>
          <p className="step-promise">“{steps[key]}”</p>
          <p className="mute" style={{ margin: 0 }}>
            Set last night — one small thing is enough. However it goes, you already chose to care.
          </p>
        </section>
      )}

      {celebrations.length > 0 && (
        <section className="card celebration" aria-live="polite">
          <div className="eyebrow">🎉 Something to celebrate today</div>
          {celebrations.map(({ habit, text }) => (
            <p key={habit.id} style={{ marginBottom: 4 }}>
              <strong>{habit.emoji} {habit.name}</strong> — {text}
            </p>
          ))}
        </section>
      )}

      <section className="card daily">
        <div className="eyebrow">Your gentle note for today</div>
        <blockquote>“{message}”</blockquote>
        <span className="tag">one day at a time</span>
      </section>

      {picks.length === 0 ? (
        <section className="card fade-in">
          <div className="eyebrow">Welcome — there’s no wrong place to start</div>
          <h2>What would you like to soften?</h2>
          <p>
            Choose anything below. You can change your mind anytime, and nothing you choose here is permanent or
            judged. This is just you, deciding what matters.
          </p>
          <HabitPicker value={picks} onToggle={addHabit} />
        </section>
      ) : (
        <>
          <section className="card">
            <div className="eyebrow">Where you are right now</div>
            {working.map(({ habit, cur, best }) => (
              <div key={habit.id} className="mini-habit" style={{ '--tint': habit.tint }}>
                <div className="mini-icon" aria-hidden="true">
                  {habit.emoji}
                </div>
                <div className="mini-name">{habit.name}</div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mini-days">{cur === 0 ? 'fresh start' : dayLabel(cur)}</div>
                  <div className="mini-meta">best {dayLabel(best)}</div>
                </div>
              </div>
            ))}
            <p style={{ marginTop: 12, marginBottom: 0 }}>
              <button type="button" className="text-link" onClick={() => onGo('journey')}>
                Open my full journey →
              </button>
            </p>
          </section>

          <section className="card">
            <div className="eyebrow">When an urge hits right now</div>
            <p style={{ marginBottom: 14 }}>No willpower speech needed. Just pick one small thing and do it.</p>
            <div className="btn-row">
              {TOOLS.map((t) => (
                <button key={t.id} type="button" className="btn btn-soft" onClick={() => onGo('tools', t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mute" style={{ margin: '12px 0 0' }}>
              Cravings peak and fade within about 15–20 minutes. One of these can carry you through the worst of it.
            </p>
          </section>
        </>
      )}

      <section className="card soft">
        <div className="eyebrow">Change your list</div>
        <HabitPicker
          value={picks}
          onToggle={(id) => (picks.includes(id) ? removeHabit(id) : addHabit(id))}
        />
        <p className="mute" style={{ marginBottom: 0 }}>
          Unchecking only removes it from your list — your history and streak are kept safe.
        </p>
      </section>
    </div>
  )
}
