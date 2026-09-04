import { DAILIES } from '../data/wisdom.js'
import { HABIT_BY_ID } from '../data/habits.js'
import { bestOf, dateKey, dayLabel, milestoneTouchedToday, streakFor } from '../lib/streaks.js'
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

export default function Today({ picks, runs, addHabit, removeHabit, onGo }) {
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
