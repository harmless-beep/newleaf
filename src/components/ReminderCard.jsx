import { useEffect, useState } from 'react'
import { isNativeApp, onReminderAnswer, setReminder } from '../lib/native.js'

const TIMES = [
  { label: '7:30 pm', hour: 19, minute: 30 },
  { label: '8:00 pm', hour: 20, minute: 0 },
  { label: '8:30 pm', hour: 20, minute: 30 },
  { label: '9:00 pm', hour: 21, minute: 0 },
]

/**
 * A quiet, fully-on-device evening reminder. Only rendered inside the Android
 * app (the web has no notification channel), so this card never appears in a
 * browser. Tapping a mood later that evening quietly cancels it — the app
 * never nudges after the day has been answered.
 */
export default function ReminderCard({ enabled, onEnabledChange, time, onTimeChange }) {
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!onReminderAnswer((answer) => {
      setDenied(answer === 'denied')
      if (answer === 'denied') onEnabledChange(false)
    })) return
    // no cleanup needed — the window callback lives for the app session
  }, [onEnabledChange])

  // Keep the native schedule in sync whenever the choice changes, and re-arm
  // on mount in case the app was reinstalled/restarted.
  useEffect(() => {
    if (enabled) setReminder(true, time.hour, time.minute)
    else setReminder(false, time.hour, time.minute)
  }, [enabled, time])

  if (!isNativeApp()) return null

  return (
    <section className="card reminder-card">
      <div className="eyebrow">Gentle evening reminder · optional</div>
      <h3>Remind you to check in, softly?</h3>
      <p style={{ marginBottom: 10 }}>
        If you&rsquo;d like, New Leaf can send one quiet notification in the evening asking how
        the day went. It only appears if the check-in is still open — answer it and the nudge
        goes quiet. Everything stays on this phone.
      </p>

      <div className="reminder-row">
        <button
          type="button"
          className={enabled ? 'btn btn-primary' : 'btn btn-ghost'}
          aria-pressed={enabled}
          onClick={() => onEnabledChange(!enabled)}
        >
          {enabled ? 'Reminder on ✓' : 'Turn on the reminder'}
        </button>

        {enabled && (
          <div className="reminder-times" role="group" aria-label="Reminder time">
            {TIMES.map((t) => (
              <button
                key={t.label}
                type="button"
                className={time.hour === t.hour && time.minute === t.minute ? 'chip selected' : 'chip'}
                onClick={() => onTimeChange({ hour: t.hour, minute: t.minute })}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {denied && (
        <p className="mute" style={{ margin: '10px 0 0' }}>
          Android notifications are turned off for New Leaf, so the reminder can&rsquo;t show.
          You can allow them in your phone&rsquo;s Settings → Apps → New Leaf, then try again.
        </p>
      )}
    </section>
  )
}
