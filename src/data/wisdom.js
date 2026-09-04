// Curated gentle content: messages of the day, milestone texts,
// and small lines used inside the urge tools.

export const DAILIES = [
  "Gentle reminder: you’re not here to be perfect. You’re here to be a little kinder to yourself than you were yesterday.",
  'Recovery isn’t a straight line. It’s a spiral — you pass the same places, but each time a little higher.',
  'Urges are like weather. You don’t have to control the sky — you just don’t have to act on every storm.',
  'A craving usually peaks and fades within 15–20 minutes. You can outlast almost anything for twenty minutes.',
  'Every day you choose differently, the old habit loses a little of its voice.',
  'You don’t need a perfect day. One honest hour is enough. One honest minute is enough.',
  'If today is hard, just make it to tonight. That’s a full win.',
  'A slip is a bend in the road, not the end of the journey. The road still goes where you’re headed.',
  'What you fight with shame grows. What you hold with kindness shrinks. Be on your own side today.',
  'Think of someone you love. Would you speak to them the way you sometimes speak to yourself? You deserve that same warmth.',
  'The best time to start was whenever. The second best time is right now — and right now is happening.',
  'You are not your habit. You are the person who keeps showing up to change it.',
  'Small steps, repeated, are quietly unstoppable.',
  'Your future self is rooting for you. Do one thing today that they’ll thank you for.',
  'Notice one thing that is going well today. However small. Let it count.',
  'You’ve survived every hard day you’ve ever had. You’re allowed to trust yourself for this one too.',
  'Boredom is often where old habits sneak back in. Have a small plan for empty moments.',
  'Feelings are allowed; choices are yours. Pause, breathe, then decide — from clarity, not from craving.',
  'When the pull comes, take three slow breaths before you do anything at all.',
  'Nobody climbs a mountain in one step. They just keep placing one foot. That’s all today asks of you.',
  'Don’t compare your middle to someone else’s highlight reel. Your pace is your pace, and it’s okay.',
  'Shame thrives in silence. Say it out loud to someone safe — or write it here. It shrinks fast.',
  'Habits loosen their grip in waves. Some days will feel easy — ride them while they last.',
  'If you slipped, you didn’t lose. You learned where the ice is thin. That’s real knowledge. Keep walking.',
  'Your body is not the enemy. Cravings are signals, and signals always pass.',
  '“One day at a time” sounds small — but it’s how every big change in history actually happened.',
  'You’re allowed to feel proud. Even one day of choosing yourself is worth celebrating.',
  'The urge is loudest right before it breaks. When it peaks, you are closer to the end than you think.',
  'Rest when you’re tired. Feed yourself properly. A tired, hungry person finds willpower much harder.',
  'Forgive yourself for yesterday so you can be free for today.',
  'Notice your wins: the extra clarity, the deeper sleep, the steadier mood. Let them be your fuel.',
  'Change the room, change the channel, change the thought. Movement is medicine.',
  'Make your future easier: keep the tempting thing out of sight and out of reach.',
  'Comparison is the thief of recovery. Your only real opponent was the version of you that gave up.',
  'Ask yourself gently: what am I really needing right now — connection, rest, meaning? The old habit was a poor substitute for it.',
  'Every time you say no to the old pattern, you say yes to the person you’re becoming.',
  'You’re doing better than your inner critic admits. Scroll back through your journal if you need proof.',
  'Hope is not naive. Hope is choosing to water what you want to grow.',
  'Be patient with yourself the way you’d be patient with a seedling. Growth is quiet before it’s visible.',
  'Tonight, before sleep, name three things that went okay today. Train your mind to notice the good.',
  "You’re not starting over from zero. You’re starting again from experience.",
  "Let go of “never again.” Just focus on “not right now” — and keep choosing “not right now” until it becomes who you are.",
]

// Milestone days and the warm words that go with them.
export const MILESTONES = [
  { day: 1, text: 'Day one — the bravest day of all.' },
  { day: 2, text: 'Two days. The craving you survived yesterday is already a little quieter.' },
  { day: 3, text: 'Three days. A new rhythm is starting to form.' },
  { day: 5, text: 'Five days — almost a week. Notice how much lighter you feel.' },
  { day: 7, text: 'One full week. You’ve proven something real to yourself.' },
  { day: 10, text: 'Ten days — the hardest part is behind you more than ahead.' },
  { day: 14, text: 'Two weeks. This is becoming who you are, not just what you’re doing.' },
  { day: 21, text: 'Three weeks. The old pattern is losing its grip.' },
  { day: 30, text: 'One month. The person you were 30 days ago would be proud of you.' },
  { day: 45, text: 'Six weeks. Steady, quiet, real progress.' },
  { day: 60, text: 'Two months. This is no longer a try — it’s a life change.' },
  { day: 90, text: 'Three months. You have rewired more than you know.' },
  { day: 120, text: 'Four months of choosing yourself. That is a serious act of love.' },
  { day: 180, text: 'Half a year. Extraordinary — and you did it one ordinary day at a time.' },
  { day: 270, text: 'Nine months. New life takes about this long to arrive. Look at you.' },
  { day: 365, text: 'One full year. A circle around the sun, and you chose yourself the whole way.' },
]

export const MILESTONE_BY_DAY = Object.fromEntries(MILESTONES.map((m) => [m.day, m.text]))

// Lines that rotate while riding out an urge.
export const RIDE_LINES = [
  'This feeling is a wave. Waves always pass.',
  'You do not have to act on this. You only have to be here.',
  'The craving is loudest right before it fades.',
  'You are bigger than this moment — and this moment is already half over.',
  'Think of something you are looking forward to. Hold it gently in your mind.',
  'Urges come and go like clouds. You are the sky, not the cloud.',
  'You have outlasted every urge you’ve ever had. This one is no different.',
  'In a few minutes, you will be glad you stayed.',
  'Notice your hands, your breath, the room around you. You are safe right now.',
  'This is not a battle. It is a visit — and the visit is ending.',
]

// Morning check-in moods — what a day can feel like, none of it wrong.
export const MOODS = [
  { id: 'bright', emoji: '☀️', name: 'Bright', reply: 'Good — let today have some of that light. You deserve it.' },
  { id: 'steady', emoji: '🌤', name: 'Steady', reply: 'Steady is strong. One solid, ordinary day is exactly enough.' },
  { id: 'quiet', emoji: '🕊️', name: 'Quiet', reply: 'Quiet days count too. Rest is part of every real recovery.' },
  { id: 'restless', emoji: '🌊', name: 'Restless', reply: 'Restless is honest. If an urge feels close, one small tool can carry you through the wave.' },
  { id: 'heavy', emoji: '🌧️', name: 'Heavy', reply: 'Heavy days are real. Thank you for checking in — be extra gentle with yourself today.' },
]

export const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m]))

// Replies for the optional evening check-in, which asks how the day went.
export const EVENING_REPLY = {
  bright: 'A bright day — let it end that way. Rest well.',
  steady: 'A steady day is a real win. Rest well.',
  quiet: 'A quiet day still counts. Rest well — you earned it.',
  restless: 'Restless days end too, and this one did. Rest well.',
  heavy: 'A heavy day is still a day you carried to the end. Rest — you made it through.',
}

// Gentle notes shown above months of journal entries from the past.
export const RETRO_NOTES = [
  'Something you wrote a while back. Read it with the same kindness you’d give a friend.',
  'A note from a quieter season. Notice the strength in it, not just the struggle.',
  'Time has passed since these words. Look how far you’ve come without even noticing.',
  'Old entries are mirrors — they show how much has grown since then.',
  'That version of you didn’t know the ending. You do — and it kept going.',
  'Words from another weather system. You made it through to calmer skies.',
]

export const RIDE_DONE = 'You rode the wave all the way down. It passed — and you stayed. That was courage.'

export const BREATH_DONE =
  'Well done. Notice how your body feels now — a little softer, a little slower. This calm is yours.'

export const GROUND_DONE =
  'You’re here now — in this room, in this body, in this moment. That is enough to begin again.'
