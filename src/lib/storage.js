import { useEffect, useState } from 'react'

// A useState that persists to localStorage under `key`.
// The whole app is intentionally local: nothing ever leaves the device.
export function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* fresh start */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  useEffect(() => {
    try {
      if (value === undefined) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable — app still works for the session */
    }
  }, [key, value])

  return [value, setValue]
}

export function clearAllData(keys) {
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  })
}

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
