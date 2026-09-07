// Hardware-back handling for full-screen overlays, on the Android wrapper.
//
// Full-screen layers (habit detail, keepsake view, celebration card) should
// behave like native screens: the back button closes the topmost one instead
// of leaving the app. The wrapper's onBackPressed asks the page via
// window.__nlAndroidBack() — true means "an overlay consumed back and is
// closing", false means "nothing open; do what you'd normally do".
//
// Components register a closer while mounted and get a deregister function
// back; the last registration wins, which matches the visually topmost layer
// in practice. The plain web never calls the window hook — nothing changes.

let stack = []
let seq = 0

export function registerBackHandler(close) {
  if (typeof window === 'undefined') return () => {}
  const id = ++seq
  stack.push({ id, close })
  return () => {
    stack = stack.filter((entry) => entry.id !== id)
  }
}

// Returns true when the topmost overlay consumed the press.
export function handleAndroidBack() {
  const top = stack[stack.length - 1]
  if (!top) return false
  try {
    top.close()
    return true
  } catch {
    return false
  }
}

if (typeof window !== 'undefined' && !window.__nlAndroidBack) {
  window.__nlAndroidBack = handleAndroidBack
}
