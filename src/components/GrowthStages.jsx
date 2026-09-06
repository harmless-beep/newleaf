// Hand-drawn growth plant: each habit's streak is a plant on the sill.
// Seed → sprout → sapling → young → flourishing. Pure SVG so it stays crisp
// at any size and weighs almost nothing; the leaves sway on a slow loop.

const potBody =
  'M38,84 L82,84 L77,110 Q76.5,113 73,113 L47,113 Q43.5,113 43,110 Z'
const soilMound = 'M40,84 Q60,76 80,84 Z'

function Pot() {
  return (
    <g>
      {/* Static painted ground shadow — replaces a CSS drop-shadow() filter,
          which would re-rasterize this SVG every animation frame. */}
      <ellipse cx="60" cy="114" rx="30" ry="4.5" fill="rgba(110, 70, 30, 0.16)" />
      <path d={potBody} fill="url(#nl-pot)" />
      <path d={potBody} fill="none" stroke="#c9a97e" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={soilMound} fill="#5f4a38" />
      <path d="M45,90 Q60,84 75,90" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* pot rim */}
      <path d="M35,78 L85,78 L82,86 L38,86 Z" fill="#c98d5f" stroke="#b3764c" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  )
}

function Seed() {
  return (
    <g className="nl-sway">
      <ellipse cx="60" cy="74" rx="5.2" ry="7" fill="#8a6a48" transform="rotate(-14 60 74)" />
      <path d="M56.5,70 Q60,66 63.5,70" stroke="#6d5238" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="49" cy="79" r="1.6" fill="#5f4a38" opacity="0.6" />
      <circle cx="71" cy="80" r="1.3" fill="#5f4a38" opacity="0.5" />
    </g>
  )
}

function Sprout() {
  return (
    <g className="nl-sway">
      <path d="M60,80 Q59.4,68 60,58" stroke="#6f8a52" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path
        d="M60,62 C52,60 47,54 46.5,47 C54,47.5 59.5,52.5 60,62 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,58 C68,56 73,50 73.5,43 C66,43.5 60.5,48.5 60,58 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
    </g>
  )
}

function Sapling() {
  return (
    <g className="nl-sway">
      <path d="M60,82 Q59.2,64 60,44" stroke="#6f8a52" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path
        d="M60,68 C50,66 44,59 43,50 C52,51 58.5,57.5 60,68 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,60 C70,58 76,51 77,42 C68,43 61.5,49 60,60 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,48 C53,45.5 49.5,40.5 49,34.5 C55.5,35.5 59.5,40 60,48 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
    </g>
  )
}

function YoungTree() {
  return (
    <g className="nl-sway">
      <path d="M60,84 Q58.8,62 60,36" stroke="#7a6248" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M60,66 Q53,62 50,56" stroke="#7a6248" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M60,54 Q67,50 70,44" stroke="#7a6248" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path
        d="M50,58 C41,55 36.5,48 36,40 C45,41 50,47 50,58 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M70,46 C79,43 83.5,36 84,28 C75,29 70,35 70,46 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,44 C51,41 46.5,34 46,26 C55,27 60,33 60,44 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,38 C69,35 73.5,28 74,20 C65,21 60,27 60,38 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <circle cx="60" cy="18" r="2" fill="#e0a63e" opacity="0.85" />
    </g>
  )
}

function Flourishing() {
  return (
    <g className="nl-sway">
      <path d="M60,86 Q58.6,60 60,32" stroke="#7a6248" strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <path d="M60,72 Q51,68 47,60" stroke="#7a6248" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M60,62 Q69,58 73,50" stroke="#7a6248" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M60,50 Q52,46 49,39" stroke="#7a6248" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path
        d="M60,58 C46,55 39,46 38,34 C50,36 58,44 60,58 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,52 C74,49 81,40 82,28 C70,30 62,38 60,52 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,42 C48,39 42,31 41,20 C52,22 58,29 60,42 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,36 C72,33 78,25 79,14 C68,16 62,23 60,36 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <path
        d="M60,30 C54,27 51,22 50.5,16 C57,17 60,22 60,30 Z"
        fill="url(#nl-leaf)"
        stroke="#5e7845"
        strokeWidth="1"
      />
      <circle cx="45" cy="30" r="2.2" fill="#e0a63e" opacity="0.9" />
      <circle cx="76" cy="20" r="2.2" fill="#e0a63e" opacity="0.9" />
      <circle cx="60" cy="10" r="2.4" fill="#e0a63e" />
    </g>
  )
}

const STAGES = [Seed, Sprout, Sapling, YoungTree, Flourishing]

/**
 * The habit's streak drawn as a plant on the sill.
 *   0        → a seed in the soil, waiting
 *   1–2      → a sprout of two leaves
 *   3–6      → a young sapling
 *   7–13     → a small tree with buds
 *   14+      → flourishing, in bloom
 */
export function growthStageFor(streak) {
  if (streak <= 0) return 0
  if (streak <= 2) return 1
  if (streak <= 6) return 2
  if (streak <= 13) return 3
  return 4
}

const STAGE_NAMES = ['planted', 'sprouting', 'taking root', 'growing tall', 'in bloom']

export default function GrowthPlant({ streak = 0, size = 96 }) {
  const Stage = STAGES[growthStageFor(streak)]
  return (
    <div className="growth-plant" role="img" aria-label={`Growth: ${STAGE_NAMES[growthStageFor(streak)]}`}>
      <svg width={size} height={size * 1.22} viewBox="0 0 120 122" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="nl-pot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9a06f" />
            <stop offset="1" stopColor="#b9824f" />
          </linearGradient>
          <linearGradient id="nl-leaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#96b478" />
            <stop offset="1" stopColor="#6b8551" />
          </linearGradient>
        </defs>
        {/* ground shadow */}
        <ellipse cx="60" cy="116" rx="26" ry="4" fill="rgba(110,70,30,0.14)" />
        <Pot />
        <Stage />
      </svg>
    </div>
  )
}
