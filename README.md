# 🌱 New Leaf — a gentle place to grow

A warm, private, ad-free web app for people softening old habits —
pornography, alcohol, smoking, lust, laziness, procrastination, and fear
of the unknown — **one day at a time**.

No accounts. No tracking. No ads. Everything (your habits, streaks, and
journal) is stored only in your own browser, on your own device.

## What's inside

| Tab | What it does |
| --- | --- |
| **🌤 Today** | Time-aware greeting, a gentle "note for today", milestone celebrations, an at-a-glance view of your streaks, and quick links into the urge tools. |
| **🌱 My journey** | Choose the habits you want to soften. Each gets a card with days-going-strong, your best run, progress to the next milestone, an affirmation, and small steps that help. "I slipped today" resets gently — your best is always kept. |
| **🌊 Urge tools** | Four small, real things to do in a hard moment: breathing (4-7-8 or box), the 5-4-3-2-1 grounding walk, "ride the wave" (a timed urge-surfing timer), and a private journal. |

## Design notes

- The tone throughout is **acceptance first**: no shame, no guilt trips,
  no toxic positivity. A slip is treated as information, not failure.
- The icons show the *goal* (lotus, water, lungs, sun…) rather than the
  habit itself.
- Milestones are celebrated at 1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90,
  120, 180, 270 and 365 days.
- Respects `prefers-reduced-motion`.
- A footer gently notes that the app is a companion, not medical advice,
  and encourages reaching out to a real person when needed.

## Run it

```bash
npm install
npm run dev      # local development
npm run build    # production build (output in dist/)
npm run preview  # preview the production build
```

## Add your own content

- Habits & their copy: `src/data/habits.js`
- Message-of-the-day, milestones, tool lines: `src/data/wisdom.js`
- Palette and styles: `src/styles.css`

## Privacy

No code in this project ever sends your data anywhere. Data lives in
`localStorage` under the keys `nl.picks`, `nl.runs` and `nl.journal`,
and can be wiped with the "Reset my data" link in the footer.
