// A quiet burst of leaves that drifts up around a small “Day N” card the
// moment a milestone day is reached (or a habit is first chosen). Purely
// decorative and non-blocking (pointer-events: none), it announces its words
// politely and fades on its own. Reduced-motion users never see it — the card
// on the page already records the moment warmly.
const LEAF_COLORS = ['#7d9c63', '#8fae74', '#64804e', '#93b17b', '#e0a63e']

// Twelve leaves, each set to fly outward on its own angle, distance, size and
// timing. Deterministic (no randomness at render) so the moment feels calm and
// always the same.
const LEAVES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2 // start at the top
  const reach = 74 + (i % 4) * 16
  return {
    tx: Math.round(Math.cos(angle) * reach),
    ty: Math.round(Math.sin(angle) * reach),
    rot: Math.round((i % 2 === 0 ? 1 : -1) * (38 + (i % 3) * 14)),
    size: 13 + (i % 3) * 5,
    color: LEAF_COLORS[i % LEAF_COLORS.length],
    delay: Math.round((i % 5) * 90) + (i >= 6 ? 140 : 0),
    dur: 1500 + (i % 4) * 220,
  }
})

function Leaf({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12,22 C6,17.2 3.6,12.2 3.6,6.8 C3.6,2.8 6.8,1 12,1 C17.2,1 20.4,2.8 20.4,6.8 C20.4,12.2 18,17.2 12,22 Z"
        fill={color}
      />
      <path
        d="M12,19 L12,4.6"
        stroke="#fffdf8"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
        fill="none"
      />
      <path
        d="M12,14 C9.6,12.6 8.6,10.8 8.3,8.4 M12,10.6 C14.4,9.2 15.4,7.4 15.7,5"
        stroke="#fffdf8"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
        fill="none"
      />
    </svg>
  )
}

export default function CelebrateBurst({ day, habitName, habitEmoji }) {
  return (
    <div className="burst-layer" role="status" aria-live="polite">
      {LEAVES.map((l, i) => (
        <span
          key={i}
          className="burst-leaf"
          style={
            {
              '--tx': `${l.tx}px`,
              '--ty': `${l.ty}px`,
              '--rot': `${l.rot}deg`,
              '--delay': `${l.delay}ms`,
              '--dur': `${l.dur}ms`,
            } }
        >
          <Leaf size={l.size} color={l.color} />
        </span>
      ))}
      <div className="burst-card">
        <div className="eyebrow">a quiet celebration</div>
        <h2 className="burst-day">
          Day {day}
          <span className="burst-habit" aria-hidden="true">
            {habitEmoji}
          </span>
        </h2>
        <p className="burst-line">
          <strong>{habitName}</strong> · you chose yourself {day === 1 ? 'today' : 'again today'}
        </p>
      </div>
    </div>
  )
}
