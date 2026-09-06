// Gentle, optional sound. A soft bell chime accompanies the milestone burst,
// so the moment lands with more than pixels. Respects the user's choice:
// remembered in localStorage, and it never makes a sound before the first
// interaction (browsers block autoplay anyway — this stays polite).

const KEY = 'nl.sound'
import chimeUrl from '../assets/chime.mp3'

export function soundPref() {
  try {
    return localStorage.getItem(KEY) || 'on'
  } catch {
    return 'on'
  }
}

export function setSoundPref(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* private mode — the pref just won't persist */
  }
}

let audio = null

/** Returns true when the chime actually played. */
export function playChime() {
  if (soundPref() !== 'on') return false
  try {
    if (!audio) {
      audio = new Audio(chimeUrl)
      audio.preload = 'auto'
    }
    audio.volume = 0.5
    audio.currentTime = 0
    const p = audio.play()
    if (p && p.catch) p.catch(() => false)
    return true
  } catch {
    return false
  }
}
