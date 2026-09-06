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

/*
 * Scroll reveals: cards that mount below the fold settle in softly the first
 * time they scroll into view. Opt-in tagging keeps it safe: the hook only
 * tags cards currently below the viewport (.nl-pre) — cards added later, or
 * already visible at mount, keep their normal entrance. Falls back to a
 * no-op when IntersectionObserver is missing (ancient WebViews).
 */
export function useScrollReveal(dep) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    if (prefersReducedMotion()) return

    const fold = window.innerHeight || document.documentElement.clientHeight
    const pending = []
    for (const card of document.querySelectorAll('.card')) {
      if (card.classList.contains('nl-revealed')) continue
      const box = card.getBoundingClientRect()
      // Only cards starting below the fold join the reveal; everything else
      // keeps the entrance animation it already has.
      if (box.top > fold * 0.92) {
        card.classList.add('nl-pre')
        pending.push(card)
      }
    }
    if (!pending.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.remove('nl-pre')
          entry.target.classList.add('nl-revealed')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    pending.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [dep])
}

// Counts from 0 up to `target` once, with a soft ease-out — used for the
// "days going strong" numbers so a streak feels earned, not just read.
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
