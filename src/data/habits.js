// Each habit is described without shame or judgment.
// The icon shows the *goal* (health, calm, growth), not the habit itself.

export const HABITS = [
  {
    id: 'pornography',
    name: 'Pornography',
    emoji: '🪷',
    tint: '#c96f4a',
    affirmation:
      'Your worth was never measured in pixels — and your mind is a garden you get to choose what grows in.',
    note:
      'A craving usually spikes, peaks, and fades within about 15–20 minutes. You don’t have to win the whole war right now — just the next twenty minutes.',
    gentle: [
      'When the pull comes, get up and move to another room.',
      'Put the phone or laptop somewhere that isn’t within arm’s reach for a while.',
      'Ask what feeling is underneath — boredom, loneliness, stress, tiredness — and write it down.',
    ],
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    emoji: '💧',
    tint: '#5f93b5',
    affirmation:
      'You are clearer, kinder and more yourself without it — and every sober morning gives a little more of you back.',
    note:
      'The first weeks are the loudest. After a few days the pull softens, and sleep, mood and clarity usually improve faster than you expect — let that be your fuel.',
    gentle: [
      'Pour yourself something special in your usual glass — a fizzy water with lime counts.',
      'Have one kind sentence ready when someone offers: “I’m taking a break, and honestly feeling good about it.”',
      'Notice your sleep tonight. It’s about to get noticeably better.',
    ],
  },
  {
    id: 'smoking',
    name: 'Smoking',
    emoji: '🌬',
    tint: '#7d9c63',
    affirmation:
      'Every breath you protect is a gift you give yourself — and your lungs start thanking you within days.',
    note:
      'Nicotine cravings pass in waves, usually under ten minutes. Each wave you ride makes the next one smaller and quieter.',
    gentle: [
      'Drink a glass of water slowly when the craving hits.',
      'Move — even two minutes of walking changes the chemistry of the moment.',
      'Keep your hands busy: a pen, a stone, a mug of tea.',
    ],
  },
  {
    id: 'lust',
    name: 'Lust',
    emoji: '🌸',
    tint: '#cf7d9f',
    affirmation:
      'You can feel desire and still choose respect — for others and for yourself. Desire is human; what you do with it is yours.',
    note:
      'Desire itself isn’t the enemy — it’s part of being alive. The goal isn’t to become numb, but to keep your heart and your choices pointed the same way.',
    gentle: [
      'Notice the pull without obeying it — observe it like weather passing overhead.',
      'Remember that every person is a whole human with a whole life, never an object.',
      'Channel the energy somewhere alive: movement, work, creativity, conversation.',
    ],
  },
  {
    id: 'laziness',
    name: 'Laziness',
    emoji: '🌞',
    tint: '#e0a63e',
    affirmation:
      'Feeling stuck isn’t a character flaw — it’s a signal. And the way back to feeling alive is often just one tiny step.',
    note:
      '“Laziness” is usually tiredness, overwhelm or fear in disguise. Rest when you’re tired — then move when you can, in the smallest step that counts.',
    gentle: [
      'Start smaller than small. Two minutes counts. Really.',
      'Do the next kind thing for future-you — a glass of water, a tidy corner, one task done.',
      'Pair something you resist with something you enjoy, so the wall feels lower.',
    ],
  },
  {
    id: 'procrastination',
    name: 'Procrastination',
    emoji: '🦋',
    tint: '#a383c0',
    affirmation:
      'Starting is the hard part — and you can do hard parts in tiny pieces. Momentum follows the first step, not the other way around.',
    note:
      'The thing you’re avoiding is usually not the task — it’s a feeling the task stirs up. Name the feeling and it loses half its power.',
    gentle: [
      'Make the first step ridiculously small: open the document. Put on the shoes.',
      'Set a five-minute timer, and give yourself full permission to stop when it rings.',
      'Ask yourself: what am I actually afraid will happen if I begin?',
    ],
  },
  {
    id: 'fear',
    name: 'Fear of the unknown',
    emoji: '🕊️',
    tint: '#8a9bc4',
    affirmation:
      'Courage is not the absence of fear — it is moving forward with fear walking quietly beside you.',
    note:
      'Uncertainty feels like danger, but you have survived one hundred percent of your unknown days so far. That’s a perfect record.',
    gentle: [
      'Write the worst case and the best case on paper. The truth is usually somewhere between, and far more livable.',
      'Take one small step into the fog — you don’t need the whole map, just the next step.',
      'Remind yourself: every confident person you admire was once facing an unknown too.',
    ],
  },
]

export const HABIT_BY_ID = Object.fromEntries(HABITS.map((h) => [h.id, h]))
