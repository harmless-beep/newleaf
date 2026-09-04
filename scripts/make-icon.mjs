// Renders the New Leaf app icon (sage leaf on cream) as real PNGs for
// every Android mipmap density, replacing the vector placeholder.
// Run:  node scripts/make-icon.mjs   (needs `npx playwright install chromium` once)
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res')

// ---- Palette (from src/styles.css) ---------------------------------------
const CREAM = '#fffdf8'
const CREAM_DEEP = '#f7eeda'
const SAGE_LIGHT = '#8fae74'
const SAGE = '#7d9c63'
const SAGE_DEEP = '#64804e'
const VEIN = '#fdfaf1'

// ---- Shared SVG pieces ----------------------------------------------------
// The leaf: a rounded teardrop with a center vein, plus two side veins,
// drawn to echo the site's 🌱 mark.
const LEAF_PATH =
  'M54,88 C38,74 26,60 26,40 C26,24 37,15 54,15 C71,15 82,24 82,40 C82,60 70,74 54,88 Z'

const LEAF_GRADIENT = `
  <defs>
    <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SAGE_LIGHT}"/>
      <stop offset="0.55" stop-color="${SAGE}"/>
      <stop offset="1" stop-color="${SAGE_DEEP}"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CREAM}"/>
      <stop offset="1" stop-color="${CREAM_DEEP}"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`

// The full leaf artwork, centered in a 108-viewBox with soft shadow.
function leafArt() {
  return `
    <g transform="translate(54,54) scale(0.72) translate(-54,-54)">
      <path d="${LEAF_PATH}" fill="#4d633c" opacity="0.18"
            transform="translate(0,4)"/>
      <path d="${LEAF_PATH}" fill="url(#leafGrad)"/>
      <path d="M54,82 L54,30" stroke="${VEIN}" stroke-width="3.4"
            stroke-linecap="round" opacity="0.85"/>
      <path d="M54,64 C48,60 44,54 42.5,46" stroke="${VEIN}" stroke-width="2.6"
            stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M54,50 C60,46 64,40 65.5,32" stroke="${VEIN}" stroke-width="2.6"
            stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M54,30 L54,88" stroke="${SAGE_DEEP}" stroke-width="1.6"
            stroke-linecap="round" opacity="0.35"/>
    </g>`
}

// Legacy launcher icon: rounded cream tile with the leaf.
function legacySvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    ${LEAF_GRADIENT}
    <rect x="0" y="0" width="108" height="108" rx="23" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="108" height="108" rx="23" fill="url(#bgGlow)"/>
    ${leafArt()}
  </svg>`
}

// Round legacy icon: same art, circular mask.
function roundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    <defs>
      <clipPath id="circle"><circle cx="54" cy="54" r="54"/></clipPath>
    </defs>
    ${LEAF_GRADIENT}
    <g clip-path="url(#circle)">
      <rect x="0" y="0" width="108" height="108" fill="url(#bgGrad)"/>
      <rect x="0" y="0" width="108" height="108" fill="url(#bgGlow)"/>
      ${leafArt()}
    </g>
  </svg>`
}

// Adaptive-icon foreground: leaf only, transparent background, sized for
// the 108dp canvas so it sits inside the safe zone.
function foregroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    ${LEAF_GRADIENT}
    ${leafArt()}
  </svg>`
}

// Adaptive-icon background: soft cream gradient filling the whole tile.
function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    ${LEAF_GRADIENT}
    <rect x="0" y="0" width="108" height="108" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="108" height="108" fill="url(#bgGlow)"/>
  </svg>`
}

// ---- Density tables -------------------------------------------------------
// Legacy launcher icon sizes (px at each density).
const LEGACY_SIZES = [
  ['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192],
]
// Adaptive icon canvas is 108dp, so its PNGs scale 1.5x per density step.
const ADAPTIVE_SIZES = [
  ['mdpi', 108], ['hdpi', 162], ['xhdpi', 216], ['xxhdpi', 324], ['xxxhdpi', 432],
]

async function renderPng(svg, px) {
  // Scale the 108-viewBox artwork up to the target pixel size.
  const scaled = svg.replace('width="108" height="108"', `width="${px}" height="${px}"`)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 })
    await page.setContent(`<!doctype html><body style="margin:0">${scaled}</body>`)
    const el = page.locator('svg')
    // omitBackground keeps the adaptive foreground truly transparent; the
    // legacy/round/background SVGs paint their own full-bleed rects so they
    // remain opaque.
    const buf = await el.screenshot({ omitBackground: true })
    return buf
  } finally {
    await browser.close()
  }
}

function writePng(dir, name, buf) {
  const d = path.join(resDir, dir)
  fs.mkdirSync(d, { recursive: true })
  const p = path.join(d, name)
  fs.writeFileSync(p, buf)
  console.log('wrote', p)
}

// Legacy + round at each density.
for (const [density, px] of LEGACY_SIZES) {
  writePng(`mipmap-${density}`, 'ic_launcher.png', await renderPng(legacySvg(), px))
  writePng(`mipmap-${density}`, 'ic_launcher_round.png', await renderPng(roundSvg(), px))
}

// Adaptive foreground + background at each density.
for (const [density, px] of ADAPTIVE_SIZES) {
  writePng(`mipmap-${density}`, 'ic_launcher_foreground.png', await renderPng(foregroundSvg(), px))
  writePng(`mipmap-${density}`, 'ic_launcher_background.png', await renderPng(backgroundSvg(), px))
}

console.log('All icon PNGs written.')