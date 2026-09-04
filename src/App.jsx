import { useEffect, useState } from 'react'
import { usePersisted, clearAllData } from './lib/storage.js'
import { addDaysKey, streakFor, todayKey } from './lib/streaks.js'
import Today from './components/Today.jsx'
import Journey from './components/Journey.jsx'
import Tools from './components/Tools.jsx'
import Keepsake from './components/Keepsake.jsx'
import CelebrateCard from './components/CelebrateCard.jsx'

const TABS = [
  { id: 'today', label: '🌤 Today' },
  { id: 'journey', label: '🌱 My journey' },
  { id: 'tools', label: '🌊 Urge tools' },
]

const ALL_KEYS = ['nl.picks', 'nl.runs', 'nl.journal', 'nl.checkins', 'nl.steps']

export default function App() {
  const [tab, setTab] = useState('today')
  const [toolSeed, setToolSeed] = useState(null)
  const [picks, setPicks] = usePersisted('nl.picks', [])
  const [runs, setRuns] = usePersisted('nl.runs', {})
  const [checkins, setCheckins] = usePersisted('nl.checkins', {})
  const [steps, setSteps] = usePersisted('nl.steps', {}) // dateKey -> tomorrow's one small step
  const [stripView, setStripView] = useState('week')
  const [journeyMonth, setJourneyMonth] = useState(null) // 'YYYY-MM' while browsing past months
  const [keepsake, setKeepsake] = useState(null) // 'YYYY-MM' while the keepsake preview is open
  const [celebrate, setCelebrate] = useState(null) // { kind: 'streak'|'month', ... } while a quiet card is open

  const go = (nextTab, subTool) => {
    setTab(nextTab)
    if (subTool) setToolSeed(subTool)
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
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="leaf" aria-hidden="true">
              🌱
            </span>
            <span>
              New Leaf
              <small>a gentle place to grow</small>
            </span>
          </div>
          <nav className="nav" aria-label="Main">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? 'active' : ''}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => go(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

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
            onKeepsake={setKeepsake}
            onCelebrate={setCelebrate}
            addHabit={addHabit}
            removeHabit={removeHabit}
            slipHabit={slipHabit}
          />
        )}
        {tab === 'tools' && <Tools key="tools" seed={toolSeed} />}
      </main>

      {keepsake && <Keepsake prefix={keepsake} onClose={() => setKeepsake(null)} />}
      {celebrate && <CelebrateCard spec={celebrate} onClose={() => setCelebrate(null)} />}

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
    </div>
  )
}
