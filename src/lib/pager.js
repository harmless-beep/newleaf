// Drag-to-page with real physics for the Journey month pager.
//
// The grid tracks the finger 1:1, a quick fling carries momentum (release
// velocity decides the page even on a short drag), the ends rubber-band with
// resistance, and release settles on the house cubic curve — the way a native
// ViewPager behaves.
//
// Deliberate tradeoffs (per the gfxinfo smoothness work):
// - Vertical scrolling is never intercepted. `touch-action: pan-y` on the
//   wrapper tells the browser horizontal pans belong to us and vertical ones
//   to the page; a vertical gesture cancels our pointer and scrolls normally.
// - Buttons inside the grid area keep their normal taps.

import { prefersReducedMotion } from './animate.js'

const SETTLE_MS = 360
const SNAP_MS = 300
const OPEN_DISTANCE = 8 // px of horizontal travel before the gesture is ours
const AXIS_RATIO = 1.4 // horizontal must beat vertical by this much
const FLING_V = 0.45 // px/ms — a fling slower than this is just a drag

function rubberBand(raw) {
  // Saturating resistance: small drags feel 1:1, hard pulls past the end
  // keep giving less and less (asymptote ~90px).
  const sign = raw < 0 ? -1 : 1
  const x = Math.abs(raw)
  return (sign * x) / (1 + x / 90)
}

export function attachPager(el, { onNext, onPrev, canNext, canPrev }) {
  if (!el) return () => {}

  let drag = null // { id, startX, startY, lastX, lastT, vx, captured, w }

  const interactive = (target) => !target.closest?.('button, a, input, textarea, select, summary')

  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!interactive(e.target)) return
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      vx: 0,
      captured: false,
      w: el.getBoundingClientRect().width || 320,
    }
  }

  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.captured) {
      if (Math.abs(dx) > OPEN_DISTANCE && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
        drag.captured = true
        el.classList.add('pager-dragging')
        el.style.transition = 'none'
      } else {
        return
      }
    }
    const dt = e.timeStamp - drag.lastT
    if (dt > 0) drag.vx = 0.8 * drag.vx + 0.2 * ((e.clientX - drag.lastX) / dt)
    drag.lastX = e.clientX
    drag.lastT = e.timeStamp
    let eff = dx
    if (dx > 0 && !canPrev()) eff = rubberBand(dx)
    if (dx < 0 && !canNext()) eff = rubberBand(dx)
    el.style.transform = `translateX(${Math.round(eff * 100) / 100}px)`
  }

  // Play the settle (snap back, or fly to the neighbouring month's width),
  // then swap the content. In reduced-motion mode everything is instant.
  const settle = (paginate, width) => {
    const finish = () => {
      el.removeEventListener('transitionend', finish)
      el.classList.remove('pager-dragging')
      el.style.transition = ''
      el.style.transform = ''
      if (paginate === 'next') onNext()
      if (paginate === 'prev') onPrev()
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    const w = width || 320
    const dist = paginate ? (paginate === 'next' ? -w : w) : 0
    el.style.transition = `transform ${paginate ? SETTLE_MS : SNAP_MS}ms cubic-bezier(0.22, 0.8, 0.3, 1)`
    el.style.transform = `translateX(${dist}px)`
    const timer = setTimeout(finish, SETTLE_MS + 140) // safety if transitionend is swallowed
    const onEnd = (e) => {
      if (e.target !== el || e.propertyName !== 'transform') return
      clearTimeout(timer)
      finish()
    }
    el.addEventListener('transitionend', onEnd)
  }

  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const d = drag
    drag = null
    if (!d.captured) return
    const dx = e.clientX - d.startX
    const went = Math.abs(dx) > d.w * 0.18
    const flung = Math.abs(d.vx) > FLING_V && Math.abs(dx) > OPEN_DISTANCE
    let paginate = null
    if (dx < 0 && (went || (flung && d.vx < 0)) && canNext()) paginate = 'next'
    else if (dx > 0 && (went || (flung && d.vx > 0)) && canPrev()) paginate = 'prev'
    settle(paginate, d.w)
  }

  const cancel = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const d = drag
    drag = null
    if (d.captured) settle(null, d.w)
  }

  el.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerup', up, { passive: true })
  window.addEventListener('pointercancel', cancel, { passive: true })

  return () => {
    el.removeEventListener('pointerdown', down)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', cancel)
    el.classList.remove('pager-dragging')
    el.style.transition = ''
    el.style.transform = ''
  }
}
