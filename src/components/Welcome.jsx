import { useEffect, useRef, useState } from 'react'
import LeafLogo from './Logo.jsx'
import { nativeTick } from '../lib/native.js'

// The one-time first-open welcome: a warm, quiet hello before the habit list
// asks anything of you. Shows only for a genuinely fresh install (no data),
// and is remembered with `nl.welcomed`.
const STOPS = [
  {
    emoji: '🌤',
    title: 'Today',
    text: 'A soft check-in each morning and evening — a place to notice yourself, not grade yourself.',
  },
  {
    emoji: '🌱',
    title: 'My journey',
    text: 'Choose what you’d like to soften, then watch your quiet progress grow, one day at a time.',
  },
  {
    emoji: '🌊',
    title: 'Urge tools',
    text: 'Breathing, grounding and writing — small real things for the hard moments.',
  },
]

// A single, short round — enough to feel the tool work without keeping anyone.
const DEMO_PATTERN = [
  ['Breathe in', 4],
  ['Breathe out', 6],
]

// A tiny living version of the breathing tool, so a first-time visitor can
// touch an urge tool before anything is asked of them. One slow round: tap,
// follow the circle, and the longer out-breath does its quiet work.
function BreatheDemo({ onOpenTools }) {
  const [status, setStatus] = useState('idle') // idle | running | done
  const [phase, setPhase] = useState(0)
  const [sec, setSec] = useState(DEMO_PATTERN[0][1])

  useEffect(() => {
    if (status !== 'running') return
    const t = setTimeout(() => {
      if (sec > 1) {
        setSec(sec - 1)
        return
      }
      if (phase < DEMO_PATTERN.length - 1) {
        setPhase(phase + 1)
        setSec(DEMO_PATTERN[phase + 1][1])
        return
      }
      setStatus('done')
    }, 1000)
    return () => clearTimeout(t)
  }, [status, sec, phase])

  const start = () => {
    nativeTick()
    setPhase(0)
    setSec(DEMO_PATTERN[0][1])
    setStatus('running')
  }

  const [label] = DEMO_PATTERN[phase]
  const growing = status === 'running' && phase === 0
  const ariaLabel =
    status === 'idle'
      ? 'Tap to try a slow breath'
      : status === 'running'
        ? `${label} ${sec}`
        : 'Breathe again'

  return (
    <div className="welcome-demo">
      <div className="eyebrow demo-eyebrow">Try one before you begin</div>
      <button
        type="button"
        className={`demo-circle${status === 'running' ? ' running' : ''}`}
        aria-label={ariaLabel}
        disabled={status === 'running'}
        style={{
          transform: growing ? 'scale(1.26)' : 'scale(1)',
          transitionDuration: status === 'running' ? `${DEMO_PATTERN[phase][1]}s` : '0.5s',
        }}
        onClick={start}
      >
        {status === 'idle' && (
          <>
            <span className="demo-label">a slow breath</span>
            <span className="demo-hint">tap to begin</span>
          </>
        )}
        {status === 'running' && (
          <>
            <span className="demo-label">{label}</span>
            <span className="demo-sec">{sec}</span>
          </>
        )}
        {status === 'done' && (
          <>
            <span className="demo-label">🌬</span>
            <span className="demo-hint">again?</span>
          </>
        )}
      </button>

      <p className="demo-note" aria-live="polite">
        {status === 'idle' && 'Longer out-breaths tell your body it’s safe — this is the shape of the tool.'}
        {status === 'running' && 'Follow the circle. That’s all it asks.'}
        {status === 'done' && (
          <>
            Slower out-breaths are the signal your body reads as safe.{' '}
            <button type="button" className="text-link" onClick={onOpenTools}>
              meet the other three tools →
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export default function Welcome({ onBegin, onOpenTools }) {
  const beginRef = useRef(null)
  useEffect(() => {
    // Bring focus to the single action so screen readers (and keyboard users)
    // land somewhere sensible instead of on the page behind.
    beginRef.current?.focus()
  }, [])

  return (
    <div className="welcome-layer">
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div className="welcome-mark">
          <LeafLogo size={86} decorative={false} />
        </div>

        <p className="eyebrow welcome-kicker">a gentle place to grow</p>
        <h1 id="welcome-title">Welcome to New Leaf</h1>
        <p className="welcome-lead">
          A quiet, private corner for softening an old habit and growing something kinder — one day at a time.
          Everything you write stays on this device.
        </p>

        <div className="welcome-stops">
          {STOPS.map((s, i) => (
            <div className="welcome-stop" key={s.title} style={{ '--stop': i }}>
              <span className="stop-ico" aria-hidden="true">
                {s.emoji}
              </span>
              <span>
                <strong>{s.title}</strong>
                <span className="stop-text">{s.text}</span>
              </span>
            </div>
          ))}
        </div>

        <BreatheDemo onOpenTools={onOpenTools} />

        <button ref={beginRef} type="button" className="btn btn-primary btn-lg welcome-begin" onClick={onBegin}>
          Begin gently <span aria-hidden="true">→</span>
        </button>
        <p className="welcome-trust">No accounts · no ads · no judgment. This is just you and a little time.</p>
      </div>
    </div>
  )
}
