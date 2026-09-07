#!/usr/bin/env node
// Per-directory bundle budgets: catch bloat where it ENTERS, not just at the
// end. The APK/JS/CSS budget (check-perf-budget.sh) watches totals; this one
// attributes every module's post-minification size (from the Vite stats
// plugin in vite.config.js) to its source directory and enforces per-area
// ceilings — so a heavy dependency or asset lands with a named suspect.
//
// Usage:
//   PERF_STATS_OUT=bundle-stats.json npm run build
//   node scripts/check-bundle-budgets.mjs bundle-stats.json
//
// Budgets use Vite/Rollup per-module "rendered" bytes as the yardstick: the
// sum over modules runs ~1.33× the actual chunk size (shared runtime helpers
// are counted once per module), so these ceilings are calibrated to that
// scale from the 2026-09 build (vendor 145.8, components 105.5, lib 33.8,
// data 13.8, src-root 9.4 KiB). What matters is that the ruler is consistent:
// growth in any area shows up here with the directory — and usually the exact
// module — to blame. gzip totals stay enforced by check-perf-budget.sh.
// Env-overridable: BUDGET_SRC, BUDGET_VENDOR, BUDGET_COMPONENTS, BUDGET_LIB,
// BUDGET_DATA, BUDGET_ASSETS.

import fs from 'node:fs'

const statsFile = process.argv[2] || 'bundle-stats.json'
const out = process.env.BUNDLE_BUDGET_SUMMARY || ''

const budgets = {
  vendor: envBytes('BUDGET_VENDOR', 192 * 1024),
  src: envBytes('BUDGET_SRC', 16 * 1024),
  'src/components': envBytes('BUDGET_COMPONENTS', 144 * 1024),
  'src/lib': envBytes('BUDGET_LIB', 48 * 1024),
  'src/data': envBytes('BUDGET_DATA', 20 * 1024),
  'src/fonts': envBytes('BUDGET_ASSETS', 1.53 * 1024 * 1024),
}

function envBytes(name, fallback) {
  const v = process.env[name]
  return v ? Number(v) : fallback
}

function dirFor(moduleId) {
  // Normalize windows/unix and vite's \0 virtual-module prefix.
  const id = moduleId.replace(/^\0/, '').replace(/\\/g, '/')
  if (id.includes('/node_modules/')) return 'vendor'
  const m = id.match(/\/(src\/[a-z]+)\//)
  if (m) return m[1]
  if (id.includes('/src/')) return 'src'
  return 'other'
}

const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'))

// Short, stable display form: `[vendor] pkg/…` or `src/…` (no machine paths).
function short(id) {
  if (id.includes('/node_modules/')) return '[vendor] ' + id.split('node_modules/').pop()
  const i = id.indexOf('/src/')
  return i === -1 ? id : id.slice(i + 1)
}

// A module can appear in several chunks; count it once at its max contribution.
const perModule = new Map()
for (const entry of stats.files) {
  const key = entry.module
  const prev = perModule.get(key) || 0
  if (entry.rendered > prev) perModule.set(key, entry.rendered)
}

const dirs = new Map()
const offenders = []
for (const [id, size] of perModule) {
  const dir = dirFor(id)
  dirs.set(dir, (dirs.get(dir) || 0) + size)
  offenders.push({ id, size, dir })
}
offenders.sort((a, b) => b.size - a.size)

const summary = []
let fail = 0
console.log('Per-directory bundle budgets')
for (const [dir, budget] of Object.entries(budgets)) {
  const actual = dirs.get(dir) || 0
  const kb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} KiB` : `${n} B`)
  if (actual <= budget) {
    const headroom = Math.round(((budget - actual) / budget) * 100)
    console.log(`  ok    ${dir.padEnd(16)} ${kb(actual).padStart(10)} / ${kb(budget)}  (${headroom}% headroom)`)
    summary.push(`| ${dir} | ${kb(actual)} | ${kb(budget)} | ${headroom}% | ✅ |`)
  } else {
    console.log(`  FAIL  ${dir.padEnd(16)} ${kb(actual).padStart(10)} / ${kb(budget)}  (over by ${kb(actual - budget)})`)
    summary.push(`| ${dir} | ${kb(actual)} | ${kb(budget)} | — | ❌ over |`)
    fail = 1
  }
}

const others = [...dirs.entries()]
  .filter(([d]) => !budgets[d])
  .map(([d, s]) => `${d} (${s} B)`)
if (others.length) {
  console.log(`  note  unattributed dirs: ${others.join(', ')}`)
}

console.log('\nTop contributors (minified):')
for (const o of offenders.slice(0, 8)) {
  console.log(`  ${String(o.size).padStart(7)} B  ${short(o.id)}`)
}

if (out) {
  const rows = Object.entries(budgets)
    .map(([dir, budget]) => {
      const actual = dirs.get(dir) || 0
      const kb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} KiB` : `${n} B`)
      const ok = actual <= budget
      const headroom = ok ? `${Math.round(((budget - actual) / budget) * 100)}%` : '—'
      return `| ${dir} | ${kb(actual)} | ${kb(budget)} | ${headroom} | ${ok ? '✅' : '❌ over'} |`
    })
    .join('\n')
  fs.appendFileSync(
    out,
    [
      '',
      '### 🧩 Per-directory budgets (minified)',
      '',
      '| Area | Now | Budget | Headroom | Status |',
      '|---|---:|---:|---:|---|',
      rows,
      '',
      '**Biggest modules:** ' +
        offenders
          .slice(0, 4)
          .map((o) => `\`${short(o.id)}\` (${o.size} B)`)
      .join(' · '),
      '',
    ].join('\n')
  )
}

if (fail) {
  console.error('bundle-budgets: FAILED — the weight has a name and a directory now.')
  process.exit(1)
}
console.log('bundle-budgets: all checks passed.')
