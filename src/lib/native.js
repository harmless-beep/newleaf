// Small, guarded bridge to the native Android wrapper. Every call is a no-op
// on the web (and in tests), so the site never depends on being inside the app.
export function nativeTick() {
  try {
    if (typeof window !== 'undefined' && window.AndroidNative && typeof window.AndroidNative.tick === 'function') {
      window.AndroidNative.tick()
    }
  } catch {
    /* not inside the app — nothing to do */
  }
}
