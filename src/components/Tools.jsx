import { useEffect, useRef, useState } from 'react'
import { usePersisted, uid } from '../lib/storage.js'
import { BREATH_DONE, GROUND_DONE, RETRO_NOTES, RIDE_DONE, RIDE_LINES } from '../data/wisdom.js'

/* ============================== breathing ============================== */

const TECHNIQUES = {
  calm: {
    name: '4-7-8 · calm the nervous system',
    desc: 'A classic for slowing a racing heart. Exhaling longer than you inhale is what signals “safe” to your body.',
    pattern: [
      ['Breathe in', 4],
      ['Hold', 7],
      ['Breathe out', 8],
    ],
    rounds: 3,
  },
  box: {
    name: 'Box breathing · steady yourself',
    desc: 'Four equal sides, like tracing a square with your breath. Used by people who must stay calm under pressure.',
    pattern: [
      ['Breathe in', 4],
      ['Hold', 4],
      ['Breathe out', 4],
      ['Hold', 4],
    ],
    rounds: 4,
  },
}

function Breathing() {
  const [techKey, setTechKey] = useState('calm')
  const tech = TECHNIQUES[techKey]
  const [status, setStatus] = useState('idle') // idle | running | paused | done
  const [phase, setPhase] = useState(0)
  const [sec, setSec] = useState(tech.pattern[0][1])
  const [round, setRound] = useState(1)

  // Reset the machine whenever the technique changes while not mid-run.
  useEffect(() => {
    setPhase(0)
    setSec(tech.pattern[0][1])
    setRound(1)
    if (status !== 'done') setStatus('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techKey])

  useEffect(() => {
    if (status !== 'running') return
    const t = setTimeout(() => {
      if (sec > 1) {
        setSec(sec - 1)
        return
      }
      if (phase < tech.pattern.length - 1) {
        setPhase(phase + 1)
        setSec(tech.pattern[phase + 1][1])
        return
      }
      if (round < tech.rounds) {
        setPhase(0)
        setSec(tech.pattern[0][1])
        setRound(round + 1)
        return
      }
      setStatus('done')
    }, 1000)
    return () => clearTimeout(t)
  }, [status, sec, phase, round, tech])

  const start = () => {
    setPhase(0)
    setSec(tech.pattern[0][1])
    setRound(1)
    setStatus('running')
  }

  const [label] = tech.pattern[phase]
  const scale = phase < 2 ? 1.55 : 1
  const isOn = status === 'running' || status === 'paused'

  return (
    <>
      <div className="eyebrow">Breathing</div>
      <div className="breath-choice">
        {Object.entries(TECHNIQUES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={techKey === key ? 'btn btn-primary' : 'btn btn-ghost'}
            disabled={status === 'running'}
            onClick={() => setTechKey(key)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <p className="mute" style={{ marginTop: -8 }}>
        {tech.desc}
      </p>

      <div className="breath-stage">
        <div className="breath-circle" style={{ transform: isOn ? `scale(${scale})` : 'scale(1)' }}>
          {status === 'done' ? (
            <div className="breath-label" style={{ textAlign: 'center', padding: '0 16px', lineHeight: 1.4 }}>
              🌬
              <br />
              Lovely.
            </div>
          ) : isOn ? (
            <>
              <span className="breath-label">{label}</span>
              <span className="breath-seconds">{sec}</span>
            </>
          ) : (
            <span className="breath-label" style={{ textAlign: 'center', padding: '0 16px', lineHeight: 1.5 }}>
              Ready when
              <br />
              you are
            </span>
          )}
        </div>
        {isOn && (
          <div className="breath-rounds">
            round {round} of {tech.rounds} · {tech.name.split(' · ')[0]}
          </div>
        )}
      </div>

      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
        {status === 'idle' && (
          <button type="button" className="btn btn-primary" onClick={start}>
            Start breathing
          </button>
        )}
        {status === 'running' && (
          <button type="button" className="btn btn-ghost" onClick={() => setStatus('paused')}>
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button type="button" className="btn btn-primary" onClick={() => setStatus('running')}>
            Resume
          </button>
        )}
        {(status === 'running' || status === 'paused') && (
          <button type="button" className="btn btn-ghost" onClick={() => setStatus('idle')}>
            Stop
          </button>
        )}
        {status === 'done' && (
          <>
            <div className="done-box" style={{ marginBottom: 10 }}>
              {BREATH_DONE}
            </div>
            <button type="button" className="btn btn-primary" onClick={start}>
              Breathe again
            </button>
          </>
        )}
      </div>
    </>
  )
}

/* ============================== grounding ============================== */

const GROUND_STEPS = [
  { n: 5, label: 'things you can see', hint: 'Look around slowly. Notice colors, shapes, light. Say them softly in your head.' },
  { n: 4, label: 'things you can touch', hint: 'Your chair, your clothes, a warm mug, the air. Feel the textures and temperatures.' },
  { n: 3, label: 'things you can hear', hint: 'Listen past the noise inside your head. A fan, birds, footsteps, your own breath.' },
  { n: 2, label: 'things you can smell', hint: 'Coffee, soap, fresh air, rain on the ground. Breathe them in slowly.' },
  { n: 1, label: 'thing you can taste', hint: 'Sip some water — or simply notice the taste already in your mouth.' },
]

function Grounding() {
  const [idx, setIdx] = useState(0)
  const [notes, setNotes] = useState(Array(GROUND_STEPS.length).fill(''))
  const [done, setDone] = useState(false)
  const step = GROUND_STEPS[idx]

  const reset = () => {
    setIdx(0)
    setNotes(Array(GROUND_STEPS.length).fill(''))
    setDone(false)
  }

  if (done) {
    return (
      <>
        <div className="eyebrow">Grounding · 5-4-3-2-1</div>
        <div className="done-box" style={{ margin: '18px 0' }}>
          {GROUND_DONE}
        </div>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Go through it again
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="eyebrow">Grounding · 5-4-3-2-1</div>
      <p className="mute" style={{ marginTop: -4 }}>
        When your mind is spinning or an urge is loud, this gently walks you back into the room — and out of the spiral.
      </p>

      <div className="ground-progress" aria-hidden="true">
        {GROUND_STEPS.map((s, i) => (
          <span key={s.n} className={`dot${i <= idx ? ' on' : ''}`} />
        ))}
      </div>

      <div className="ground-step">
        <div className="ground-count">{step.n}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '2px 0 6px' }}>{step.label}</h3>
          <p className="mute" style={{ marginBottom: 8 }}>
            {step.hint}
          </p>
          <textarea
            className="journal"
            style={{ minHeight: 90 }}
            value={notes[idx]}
            placeholder="Write what you notice — or say it in your head, that’s enough."
            onChange={(e) => {
              const next = [...notes]
              next[idx] = e.target.value
              setNotes(next)
            }}
          />
        </div>
      </div>

      <div className="btn-row">
        {idx > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setIdx(idx - 1)}>
            ← Back
          </button>
        )}
        {idx < GROUND_STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setIdx(idx + 1)}>
            Next: {GROUND_STEPS[idx + 1].n} {GROUND_STEPS[idx + 1].label.split(' ')[0] === 'things' ? 'things' : 'thing'} →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setDone(true)}>
            I’m here now
          </button>
        )}
      </div>
    </>
  )
}

/* ============================== ride the wave ============================== */

const RIDE_CHOICES = [5, 10, 15]

function RideWave() {
  const [mins, setMins] = useState(10)
  const [status, setStatus] = useState('idle') // idle | running | done
  const [left, setLeft] = useState(0)
  const [line, setLine] = useState(RIDE_LINES[0])
  const endRef = useRef(0)

  useEffect(() => {
    if (status !== 'running') return
    const tick = () => {
      const msLeft = endRef.current - Date.now()
      const rem = Math.max(0, Math.ceil(msLeft / 1000))
      setLeft(rem)
      const passed = mins * 60 - rem
      setLine(RIDE_LINES[Math.floor(passed / 12) % RIDE_LINES.length])
      if (msLeft <= 0) setStatus('done')
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [status, mins])

  const start = (m) => {
    setMins(m)
    endRef.current = Date.now() + m * 60000
    setLeft(m * 60)
    setLine(RIDE_LINES[0])
    setStatus('running')
  }

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (status === 'done') {
    return (
      <>
        <div className="eyebrow">Ride the wave</div>
        <div className="done-box" style={{ margin: '18px 0' }}>
          {RIDE_DONE}
        </div>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={() => setStatus('idle')}>
            Done — back to my day
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="eyebrow">Ride the wave</div>
      <p className="mute" style={{ marginTop: -4 }}>
        An urge is a wave: it rises, peaks, and always falls — usually within about twenty minutes. You don’t have to
        fight it, just outlast it. Choose how long to ride.
      </p>

      {status === 'running' ? (
        <>
          <div className="ride-clock">{mmss(left)}</div>
          <div className="ride-line" key={line}>
            {line}
          </div>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStatus('idle')}>
              Stop early — that’s okay
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="btn-row" style={{ justifyContent: 'center', margin: '18px 0' }}>
            {RIDE_CHOICES.map((m) => (
              <button key={m} type="button" className="btn btn-primary" onClick={() => start(m)}>
                {m} minutes
              </button>
            ))}
          </div>
          <p className="mute" style={{ textAlign: 'center', marginBottom: 0 }}>
            A gentle message will keep you company while the wave passes.
          </p>
        </>
      )}
    </>
  )
}

/* ============================== journal ============================== */

function Journal() {
  const [entries, setEntries] = usePersisted('nl.journal', [])
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  const save = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setEntries([{ id: uid(), at: new Date().toISOString(), text: trimmed }, ...entries])
    setText('')
  }

  const del = (id) => setEntries(entries.filter((e) => e.id !== id))

  const query = q.trim().toLowerCase()
  const shown = query ? entries.filter((e) => e.text.toLowerCase().includes(query)) : entries
  // Group the shown entries by calendar month, newest first.
  const groups = []
  for (const e of shown) {
    const d = new Date(e.at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(e)
    else groups.push({ key, items: [e] })
  }
  const now = new Date()

  return (
    <>
      <div className="eyebrow">Write it out</div>
      <p className="mute" style={{ marginTop: -4 }}>
        Sometimes an urge is a message wearing a disguise — loneliness, anger, boredom, exhaustion. Writing pulls the
        disguise off. Everything here stays on this device, and no one will ever read it but you.
      </p>

      <textarea
        className="journal"
        placeholder="What’s happening right now? What triggered this? What are you feeling — and what do you actually need? There’s no wrong answer here."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={save}>
          Let it out
        </button>
        <span className="mute">saved only on this device</span>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="eyebrow">Previous entries</div>
        {entries.length === 0 ? (
          <div className="empty-note">
            Nothing here yet. When a feeling gets heavy, come back — a page that listens is a powerful thing.
          </div>
        ) : (
          <>
            <input
              type="search"
              className="journal-search"
              placeholder="Search past entries…"
              aria-label="Search journal entries"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {shown.length === 0 ? (
              <div className="empty-note">
                Nothing matches “{q.trim()}”. It may be hiding under different words — or simply resting somewhere else.
              </div>
            ) : (
              groups.map((g) => {
                const head = new Date(g.items[0].at)
                const y = head.getFullYear()
                const m = head.getMonth()
                const label = head.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                const monthsAgo = now.getFullYear() * 12 + now.getMonth() - (y * 12 + m)
                const note = RETRO_NOTES[Math.abs(y * 12 + m) % RETRO_NOTES.length]
                return (
                  <div key={g.key} className="journal-month">
                    <div className="month-head">
                      <h4>{label}</h4>
                      <span className="mute">
                        {g.items.length} {g.items.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    {monthsAgo > 0 && (
                      <p className="retro-note">
                        {note} · from {monthsAgo === 1 ? 'a month' : `${monthsAgo} months`} ago.
                      </p>
                    )}
                    {g.items.map((e) => (
                      <div key={e.id} className="journal-entry">
                        <div className="when">
                          {new Date(e.at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <p>{e.text}</p>
                        <button type="button" className="del" aria-label="Delete entry" onClick={() => del(e.id)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </>
  )
}

/* ============================== page ============================== */

const TOOLS = [
  { id: 'breathe', label: '🌬 Breathe', title: 'Breathe' },
  { id: 'ground', label: '🌍 Ground', title: 'Ground' },
  { id: 'ride', label: '🌊 Ride it out', title: 'Ride it out' },
  { id: 'journal', label: '✍️ Write it out', title: 'Write it out' },
]

export default function Tools({ seed = null }) {
  const [active, setActive] = useState(seed || 'breathe')

  useEffect(() => {
    if (seed) setActive(seed)
  }, [seed])

  return (      <div className="tab-view tool-view" style={{ marginTop: 26 }}>
      <section className="hero" style={{ marginBottom: 16 }}>
        <h1>Urge tools</h1>
        <p className="sub">Small, real things you can do in the middle of a hard moment.</p>
      </section>

      <div className="tool-banner">
        <span className="ico" aria-hidden="true">
          🌊
        </span>
        <span>
          An urge peaks and fades within about 15–20 minutes. You don’t need perfect willpower — you just need to
          spend that window on purpose. Pick whatever feels right. Take what helps; leave the rest.
        </span>
      </div>

      <div className="tool-nav" role="tablist" aria-label="Urge tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={active === t.id ? 'active' : ''}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section key={active} className="card">
        {active === 'breathe' && <Breathing key="breathe" />}
        {active === 'ground' && <Grounding key="ground" />}
        {active === 'ride' && <RideWave key="ride" />}
        {active === 'journal' && <Journal key="journal" />}
      </section>
    </div>
  )
}
