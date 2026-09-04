import { useState } from 'react'
import { MOOD_BY_ID } from '../data/wisdom.js'
import { dayMood } from '../lib/checkins.js'
import { reflectionText } from '../lib/reflection.js'
import { dateKey, streakFor } from '../lib/streaks.js'

// Everything the keepsake shows is read straight from this device's storage —
// nothing ever leaves it. The page prints with its own @media print styling,
// so the browser's "Save as PDF" produces a warm, self-contained document.
function readAll() {
  const grab = (k, fb) => {
    try {
      const raw = localStorage.getItem(k)
      return raw != null ? JSON.parse(raw) : fb
    } catch {
      return fb
    }
  }
  return {
    picks: grab('nl.picks', []),
    runs: grab('nl.runs', {}),
    checkins: grab('nl.checkins', {}),
    journal: grab('nl.journal', []),
  }
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Keepsake({ prefix, onClose }) {
  const [{ picks, runs, checkins, journal }] = useState(readAll)
  const pad = (n) => String(n).padStart(2, '0')
  const today = dateKey()
  const [y, m] = prefix.split('-').map(Number)
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long' })
  const past = prefix < today.slice(0, 7)

  // Calendar cells for the month (same honest rules as the Journey grid).
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const last = new Date(y, m, 0).getDate()
  const cells = []
  for (let b = 0; b < lead; b++) cells.push(null)
  for (let d = 1; d <= last; d++) {
    const key = `${prefix}-${pad(d)}`
    const future = key > today
    if (future) {
      cells.push({ date: d, future, mood: null, mark: '' })
      continue
    }
    const tracked = picks.filter((id) => {
      const run = runs[id]
      return run && key >= run.anchor
    })
    const kept = tracked.filter((id) => streakFor(runs[id], key) >= 1).length
    const mid = dayMood(checkins, key)
    cells.push({
      date: d,
      future,
      mood: mid ? MOOD_BY_ID[mid] : null,
      mark: tracked.length === 0 ? '—' : kept === tracked.length ? '✓' : `${kept}/${tracked.length}`,
    })
  }

  const ref = reflectionText({ today, picks, runs, checkins, monthKey: prefix, past })
  const monthJournal = journal.filter((e) => {
    const d = new Date(e.at)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` === prefix
  })

  const rows = []
  for (let r = 0; r < cells.length; r += 7) rows.push(cells.slice(r, r + 7))

  return (
    <div className="keepsake-layer">
      <div className="keepsake">
        <header className="ks-head">
          <div className="ks-brand">🌱 New Leaf</div>
          <h1>{monthName} {y}</h1>
          <p className="ks-sub">a quiet keepsake of the month — made only on this device</p>
        </header>

        {ref.lines.length > 0 && (
          <section>
            <h2>A gentle look back</h2>
            <ul className="ks-lines">
              {ref.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <p className="ks-close">{ref.closing}</p>
          </section>
        )}

        <section>
          <h2>The month at a glance</h2>
          <table className="ks-grid">
            <thead>
              <tr>
                {WEEKDAYS.map((w) => (
                  <th key={w}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) =>
                    c ? (
                      <td key={j} className={c.future ? 'ks-future' : ''}>
                        <span className="ks-date">{c.date}</span>
                        <span className="ks-mood">{c.future ? '' : c.mood ? c.mood.emoji : '·'}</span>
                        <span className="ks-mark">{c.future ? '' : c.mark}</span>
                      </td>
                    ) : (
                      <td key={j} />
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ks-legend">✓ every path kept · like 2/3 some · — no active path · a dim dot is a day without a check-in</p>
        </section>

        {monthJournal.length > 0 && (
          <section>
            <h2>What you wrote</h2>
            {monthJournal.map((e) => (
              <div key={e.id} className="ks-entry">
                <div className="ks-when">
                  {new Date(e.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
                <p>{e.text}</p>
              </div>
            ))}
          </section>
        )}

        <footer className="ks-foot">
          <p>Kept with New Leaf — every word on this page lived only in your browser. https://harmless-beep.github.io/newleaf</p>
        </footer>
      </div>

      <div className="keepsake-tools">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Save as PDF
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Done
        </button>
        <span className="mute">In the print dialog, choose “Save as PDF”. This preview is private — nothing is uploaded.</span>
      </div>
    </div>
  )
}
