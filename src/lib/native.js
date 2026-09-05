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

/**
 * Tells the native wrapper the first real frame of the app has been painted,
 * so its splash can dissolve at exactly that moment instead of lifting early
 * onto a blank page. When the in-page header logo is present, its CSS-px box
 * is sent along so the splash leaf can fly up into the app bar. Fires after a
 * double requestAnimationFrame — i.e. after at least one painted frame — and
 * is a no-op on the web.
 */
export function notifyAppReady() {
  if (
    !isNativeApp() ||
    (typeof window.AndroidNative.pageReady !== 'function' &&
      typeof window.AndroidNative.pageReadyAt !== 'function')
  )
    return
  let sent = false
  const send = () => {
    if (sent) return
    sent = true
    try {
      const hasAt = typeof window.AndroidNative.pageReadyAt === 'function'
      const logo = hasAt ? document.querySelector('.brand-mark svg') : null
      if (logo) {
        const r = logo.getBoundingClientRect()
        window.AndroidNative.pageReadyAt(
          Math.round(r.left),
          Math.round(r.top),
          Math.round(r.width),
          Math.round(r.height),
        )
      } else if (typeof window.AndroidNative.pageReady === 'function') {
        window.AndroidNative.pageReady()
      }
    } catch {
      /* ignore */
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(send))
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
