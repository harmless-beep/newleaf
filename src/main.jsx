import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// The Android wrapper reports its edge-to-edge system-bar insets here (in CSS
// px), so the page can pad the header and footer. On the web this never runs
// and the variables stay 0px.
window.__setSafeInsets = (top, bottom) => {
  const root = document.documentElement
  root.style.setProperty('--inset-top', `${top}px`)
  root.style.setProperty('--inset-bottom', `${bottom}px`)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
