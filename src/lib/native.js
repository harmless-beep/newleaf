// Small, guarded bridge to the native Android wrapper. Every call is a no-op
// on the web (and in tests), so the site never depends on being inside the app.
export function isNativeApp() {
  return typeof window !== 'undefined' && !!window.AndroidNative
}

export function nativeTick() {
  try {
    if (isNativeApp() && typeof window.AndroidNative.tick === 'function') {
      window.AndroidNative.tick()
    }
  } catch {
    /* not inside the app — nothing to do */
  }
}

// ---- opt-in evening reminder (Android-only, fully on-device) ------------

/** Turns the gentle evening reminder on/off at the given local 24h time. */
export function setReminder(enabled, hour, minute) {
  try {
    if (isNativeApp() && typeof window.AndroidNative.setReminder === 'function') {
      window.AndroidNative.setReminder(enabled, hour, minute)
    }
  } catch {
    /* ignore — reminder simply stays off */
  }
}

/**
 * Mirrors a check-in into native storage so the notification never fires after
 * the evening was already answered. slot: 'morning' | 'evening'.
 */
export function noteCheckin(slot, moodName = '') {
  try {
    if (isNativeApp() && typeof window.AndroidNative.noteCheckin === 'function') {
      window.AndroidNative.noteCheckin(slot, moodName)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Native answers after the permission prompt: 'granted' | 'denied' | 'off'.
 * Registers the callback; returns undefined if not inside the app.
 */
export function onReminderAnswer(cb) {
  if (!isNativeApp()) return false
  try {
    window.__reminderAnswer = (answer) => {
      if (typeof cb === 'function') cb(answer)
    }
    return true
  } catch {
    return false
  }
}
