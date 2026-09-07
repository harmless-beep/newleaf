import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

// Per-module bundle stats for the per-directory budget gate. Rollup already
// knows each module's post-minification contribution to its chunk (the same
// numbers treemap visualizers use) — this writes them to bundle-stats.json
// (gitignored) on every build so `npm run budget:dirs` can attribute weight
// to a source directory. The write costs nothing at runtime.
function bundleStats() {
  return {
    name: 'newleaf-bundle-stats',
    generateBundle(_, bundle) {
      const entries = []
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        for (const [id, mod] of Object.entries(chunk.modules)) {
          entries.push({
            file: chunk.fileName,
            module: id.replace(/^\0/, ''),
            rendered: mod.renderedLength,
          })
        }
      }
      entries.sort((a, b) => b.rendered - a.rendered)
      fs.writeFileSync(
        process.env.PERF_STATS_OUT || 'bundle-stats.json',
        JSON.stringify({ generatedAt: new Date().toISOString(), files: entries }, null, 2)
      )
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), bundleStats()],
})
