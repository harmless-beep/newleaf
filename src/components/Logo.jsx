import { useId } from 'react'

// The New Leaf mark: a hand-drawn sage leaf on a soft cream tile, echoing the
// Android launcher icon and splash. Used in the header and the welcome screen.
// `decorative` hides it from assistive tech (it sits next to the wordmark).
export default function LeafLogo({ size = 34, decorative = true, className = '' }) {
  // Unique gradient/clip ids per instance so several logos can share the page.
  const raw = useId()
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '')
  const bgGrad = `nl-bg-${uid}`
  const bgGlow = `nl-glow-${uid}`
  const leafGrad = `nl-leaf-${uid}`
  const clip = `nl-clip-${uid}`

  const extras = decorative ? { 'aria-hidden': 'true', focusable: 'false' } : { role: 'img', 'aria-label': 'New Leaf' }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      className={`leaf-logo ${className}`.trim()}
      {...extras}
    >
      <defs>
        <linearGradient id={bgGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#f7eeda" />
        </linearGradient>
        <radialGradient id={bgGlow} cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={leafGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fae74" />
          <stop offset="0.55" stopColor="#7d9c63" />
          <stop offset="1" stopColor="#64804e" />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="1" y="1" width="106" height="106" rx="26" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="108" height="108" fill={`url(#${bgGrad})`} />
        <rect x="0" y="0" width="108" height="108" fill={`url(#${bgGlow})`} />
        {/* the leaf, sitting gently inside the tile */}
        <g transform="translate(54,56) scale(0.74) translate(-54,-54)">
          <path
            d="M54,88 C38,74 26,60 26,40 C26,24 37,15 54,15 C71,15 82,24 82,40 C82,60 70,74 54,88 Z"
            fill="#4d633c"
            opacity="0.16"
            transform="translate(0,4)"
          />
          <path
            d="M54,88 C38,74 26,60 26,40 C26,24 37,15 54,15 C71,15 82,24 82,40 C82,60 70,74 54,88 Z"
            fill={`url(#${leafGrad})`}
          />
          <path d="M54,82 L54,30" stroke="#fdfaf1" strokeWidth="3.4" strokeLinecap="round" opacity="0.85" />
          <path d="M54,64 C48,60 44,54 42.5,46" stroke="#fdfaf1" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M54,50 C60,46 64,40 65.5,32" stroke="#fdfaf1" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.7" />
        </g>
      </g>

      <rect
        x="1"
        y="1"
        width="106"
        height="106"
        rx="26"
        fill="none"
        stroke="#eedcc2"
        strokeWidth="1.6"
        opacity="0.9"
      />
    </svg>
  )
}
