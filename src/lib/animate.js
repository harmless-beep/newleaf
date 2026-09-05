import { useEffect, useState } from 'react'

// True when the user has asked for less motion (also respected by the CSS,
// which zeroes animation duration/delay via `prefers-reduced-motion`).
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Counts from 0 up to `target` once, with a soft ease-out — used for the
// “days going strong” numbers so a streak feels earned, not just read.
// Falls straight to the target when reduced motion is preferred.
export function useCountUp(target, duration = 650) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const end = Math.max(0, Math.round(target || 0))
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      setShown(end)
      return
    }
    let raf
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - k, 3) // ease-out cubic
      setShown(Math.round(end * eased))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return shown
}
