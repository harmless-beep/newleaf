import { HABITS } from '../data/habits.js'
import { nativeTick } from '../lib/native.js'

// Multi-select chips for choosing which habits to work on.
// Toggling off a selected chip simply removes it from the list —
// nothing is deleted, ever. `available` optionally limits which
// chips are shown (useful for “add another” pickers).
export default function HabitPicker({ value, onToggle, available }) {
  const list = available ? HABITS.filter((h) => available.includes(h.id)) : HABITS
  return (
    <div className="chips" role="group" aria-label="Choose habits to work on">
      {list.map((h) => {
        const selected = value.includes(h.id)
        return (
          <button
            key={h.id}
            type="button"
            className={`chip${selected ? ' selected' : ''}`}
            style={{ '--tint': h.tint }}
            aria-pressed={selected}
            onClick={() => {
              nativeTick() // the pick answers the finger
              onToggle(h.id)
            }}
          >
            <span aria-hidden="true">{h.emoji}</span>
            {h.name}
            {selected && (
              <span className="check" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
