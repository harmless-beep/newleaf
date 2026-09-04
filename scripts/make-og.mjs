// Regenerates the social preview image from scripts/og-cover.html.
// Run:  node scripts/make-og.mjs   (needs `npx playwright install chromium` once)
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const htmlPath = path.join(root, 'scripts', 'og-cover.html')
const outDir = path.join(root, 'public')
const outPath = path.join(outDir, 'og-cover.png')
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'))
  await page.screenshot({ path: outPath })
} finally {
  await browser.close()
}
console.log('wrote', outPath)
