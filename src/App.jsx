import { useEffect, useState } from 'react'
import { usePersisted, clearAllData } from './lib/storage.js'
import { addDaysKey, milestoneTouchedToday, streakFor, todayKey } from './lib/streaks.js'
import { captureMonth, missingSnapshots } from './lib/keepsakes.js'
import Today from './components/Today.jsx'
import Journey from './components/Journey.jsx'
import Tools from './components/Tools.jsx'
import Keepsake from './components/Keepsake.jsx'
import CelebrateCard from './components/CelebrateCard.jsx'
import CelebrateBurst from './components/CelebrateBurst.jsx'
import ReminderCard from './components/ReminderCard.jsx'
import Welcome from './components/Welcome.jsx'
import LeafLogo from './components/Logo.jsx'
import { nativeTick, notifyAppReady } from './lib/native.js'
import { prefersReducedMotion } from './lib/animate.js'
import { HABIT_BY_ID } from './data/habits.js'

const TABS = [
  { id: 'today', emoji: '🌤', word: 'Today' },
  { id: 'journey', emoji: '🌱', word: 'My journey' },
  { id: 'tools', emoji: '🌊', word: 'Urge tools' },
]



const ALL_KEYS = ['nl.picks', 'nl.runs', 'nl.journal', 'nl.checkins', 'nl.steps', 'nl.keepsakes', 'nl.reminder', 'nl.welcomed', 'nl.celebrated']

const readJournal = () => {
  try {
    const raw = localStorage.getItem('nl.journal')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [tab, setTab] = useState('today')
  const [toolSeed, setToolSeed] = useState(null)
  const [picks, setPicks] = usePersisted('nl.picks', [])
  const [runs, setRuns] = usePersisted('nl.runs', {})
  const [checkins, setCheckins] = usePersisted('nl.checkins', {})
  const [steps, setSteps] = usePersisted('nl.steps', {}) // dateKey -> tomorrow's one small step
  const [keepsakes, setKeepsakes] = usePersisted('nl.keepsakes', {}) // 'YYYY-MM' -> frozen closed-month snapshot
  const [stripView, setStripView] = useState('week')
  const [journeyMonth, setJourneyMonth] = useState(null) // 'YYYY-MM' while browsing past months
  const [keepsake, setKeepsake] = useState(null) // 'YYYY-MM' while the keepsake preview is open
  const [celebrate, setCelebrate] = useState(null) // { kind: 'streak'|'month', ... } while a quiet card is open
  const [reminder, setReminder] = usePersisted('nl.reminder', { enabled: false, hour: 20, minute: 0 })
  const [welcomed, setWelcomed] = usePersisted('nl.welcomed', false)
  // Milestones already honoured with a leaf burst, per habit (persisted, so a
  // milestone day celebrates once — never nagging on every open of the app).
  const [celebrated, setCelebrated] = usePersisted('nl.celebrated', {})
  const [burst, setBurst] = useState(null) // { day, habitName, habitEmoji } while a burst floats

  // The moment the first frame is actually painted, let the Android wrapper
  // dissolve its splash (a no-op on the web) — so the reveal never lifts onto
  // a blank or half-painted page.
  useEffect(() => {
    notifyAppReady()
  }, [])

  const go = (nextTab, subTool) => {
    setTab(nextTab)
    if (subTool) setToolSeed(subTool)
  }

  // A truly first-time visitor (no data at all yet) gets one warm welcome;
  // anyone returning to existing data skips straight to Today.
  const fresh =
    picks.length === 0 &&
    Object.keys(runs).length === 0 &&
    Object.keys(checkins).length === 0 &&
    Object.keys(steps).length === 0 &&
    Object.keys(keepsakes).length === 0 &&
    readJournal().length === 0
  const showWelcome = !welcomed && fresh
  const begin = () => {
    nativeTick()
    setWelcomed(true)
  }

  // Keep each run's "best" up to date as time passes (best never shrinks).
  const today = todayKey()
  useEffect(() => {
    let next = null
    for (const id of picks) {
      const run = runs[id]
      if (!run) continue
      const cur = streakFor(run, today)
      if (cur > (run.best || 0)) {
        next = { ...(next || runs), [id]: { ...run, best: cur } }
      }
    }
    if (next) setRuns(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, runs])

  // Preserve closed months as keepsakes: the moment a month has ended (and on
  // every later load, for any recorded month still missing one). Capturing is
  // a one-time freeze per month — later slips and fresh starts never rewrite
  // what a closed month truly was.
  useEffect(() => {
    const missing = missingSnapshots({ keepsakes, today, runs, checkins, journal: readJournal() })
    if (missing.length === 0) return
    const next = { ...keepsakes }
    for (const prefix of missing) {
      next[prefix] = captureMonth(prefix, { today, picks, runs, checkins, journal: readJournal() })
    }
    setKeepsakes(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, runs, checkins])

  // When a habit reaches a milestone day — or is first chosen (day one) —
  // honour it once with a gentle leaf burst. Each milestone is remembered, so
  // the moment celebrates the first time it is seen, on any tab, ever.
  useEffect(() => {
    const t = todayKey()
    for (const id of picks) {
      const cur = streakFor(runs[id], t)
      if (cur <= 0 || !milestoneTouchedToday(cur)) continue
      if ((celebrated[id] || 0) >= cur) continue
      const habit = HABIT_BY_ID[id]
      setCelebrated({ ...celebrated, [id]: cur })
      if (prefersReducedMotion()) return // the page card already says it warmly
      setBurst({ day: cur, habitName: habit.name, habitEmoji: habit.emoji })
      nativeTick()
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, runs, celebrated])

  // Let the burst float for a moment, then quietly clear it.
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 3800)
    return () => clearTimeout(t)
  }, [burst])

  const addHabit = (id) => {
    if (!picks.includes(id)) setPicks([...picks, id])
    // First time choosing a habit starts the clock today.
    if (!runs[id]) setRuns({ ...runs, [id]: { anchor: today, best: 0 } })
  }

  const removeHabit = (id) => {
    setPicks(picks.filter((x) => x !== id))
    // Keep history and best, but re-adding later starts a fresh count.
    const run = runs[id]
    if (run) setRuns({ ...runs, [id]: { ...run, anchor: addDaysKey(today, 1) } })
  }

  // Slipping starts the fresh count tomorrow, so the slip day itself never
  // counts as a clean day. Best is kept, with warmth.
  const slipHabit = (id) => {
    const run = runs[id] || { anchor: today, best: 0 }
    const cur = streakFor(run, today)
    setRuns({ ...runs, [id]: { anchor: addDaysKey(today, 1), best: Math.max(run.best || 0, cur) } })
  }

  const resetAll = () => {
    clearAllData(ALL_KEYS)
    window.location.reload()
  }

  return (
    <div className="app">
      {/* A brand-new visitor sees only the welcome; the app itself (header,
          tabs, footer) mounts once they begin. */}
      {showWelcome ? (
        <Welcome
          onBegin={begin}
          onOpenTools={() => {
            begin()
            go('tools', 'breathe')
          }}
        />
      ) : (
        <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">
              <LeafLogo size={36} decorative />
            </span>
            <span>
              New Leaf
              <small>a gentle place to grow</small>
            </span>
          </div>
          <nav className="nav nav-top" aria-label="Main">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? 'active' : ''}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => go(t.id)}
              >
                {t.emoji} {t.word}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Phone bottom tab bar — fixed under the thumb, hidden on wide screens
          (the matching top nav hides on narrow ones, so only one is ever
          exposed to assistive tech). */}
      <nav className="nav-bottom" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => go(t.id)}
          >
            <span className="tab-ico" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="tab-word">{t.word}</span>
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && (
          <Today
            key="today"
            picks={picks}
            runs={runs}
            checkins={checkins}
            setCheckins={setCheckins}
            steps={steps}
            setSteps={setSteps}
            addHabit={addHabit}
            removeHabit={removeHabit}
            onGo={go}
          />
        )}
        {tab === 'journey' && (
          <Journey
            key="journey"
            picks={picks}
            runs={runs}
            checkins={checkins}
            stripView={stripView}
            setStripView={setStripView}
            journeyMonth={journeyMonth}
            setJourneyMonth={setJourneyMonth}
            keepsakes={keepsakes}
            onKeepsake={setKeepsake}
            onCelebrate={setCelebrate}
            addHabit={addHabit}
            removeHabit={removeHabit}
            slipHabit={slipHabit}
          />
        )}
        {tab === 'tools' && <Tools key="tools" seed={toolSeed} />}
      </main>

      {keepsake && <Keepsake prefix={keepsake} keepsakes={keepsakes} onClose={() => setKeepsake(null)} />}
      {celebrate && <CelebrateCard spec={celebrate} keepsakes={keepsakes} onClose={() => setCelebrate(null)} />}
      {burst && <CelebrateBurst day={burst.day} habitName={burst.habitName} habitEmoji={burst.habitEmoji} />}

      <ReminderCard
        enabled={reminder.enabled}
        onEnabledChange={(enabled) => setReminder({ ...reminder, enabled })}
        time={{ hour: reminder.hour, minute: reminder.minute }}
        onTimeChange={({ hour, minute }) => setReminder({ ...reminder, hour, minute })}
      />

      <footer className="footer">
        <p className="care">
          🕊 Everything you write here stays on this device — there are no accounts and no ads. New Leaf is a gentle
          companion, not medical advice. If you’re struggling more than usual, please also reach out to a real person:
          a trusted friend, a counselor, or a local helpline.
        </p>
        <p>
          Made with warmth. ·{' '}
          <button type="button" className="text-link" onClick={resetAll}>
            Reset my data
          </button>
        </p>
      </footer>
        </>
      )}
    </div>
  )
}
