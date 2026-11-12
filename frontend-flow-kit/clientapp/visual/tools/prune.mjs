#!/usr/bin/env node
/**
 * Free disk space taken by old QA evidence without touching versioned files.
 *
 *   npm run visual:prune              dry run: what would be removed
 *   npm run visual:prune -- --yes     remove
 *   … [--keep 1]                      bundles kept intact per screen slug (default 1, the newest)
 *
 * For older bundles it removes only git-ignored content (screenshots, comparison/, data/, drafts) via
 * `git clean -X`; findings.md, report.json, index.html and evidence scripts stay. It also clears the
 * Playwright MCP output folder (.playwright-mcp/output, git-ignored). The browser profile is kept.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ARTIFACT_DIR, REPO_ROOT } from '../lib/project.mjs'

const REPO = REPO_ROOT
const QA = path.join(REPO, ARTIFACT_DIR)
const args = process.argv.slice(2)
const yes = args.includes('--yes')
const keepIdx = args.indexOf('--keep')
const keep = keepIdx >= 0 ? Number(args[keepIdx + 1]) : 1

const bundles = fs.existsSync(QA)
  ? fs.readdirSync(QA, { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(e.name)).map((e) => e.name).sort()
  : []
// "<timestamp>-<slug>" or "<timestamp>__<slug>"; the slug names the screen/component.
const slugOf = (name) => name.replace(/^\d{4}-\d{2}-\d{2}T[\d-]+Z?(?:__|-)/, '')
const bySlug = new Map()
for (const b of bundles) bySlug.set(slugOf(b), [...(bySlug.get(slugOf(b)) ?? []), b])

const targets = [...bySlug.values()].flatMap((list) => list.slice(0, Math.max(0, list.length - keep)))
const mcpOutput = path.join(REPO, '.playwright-mcp', 'output')
const du = (p) => (fs.existsSync(p) ? spawnSync('du', ['-sh', p], { encoding: 'utf8' }).stdout.split('\t')[0] : '0')

console.log(`[visual:prune] keep ${keep} per slug: ${[...bySlug.entries()].map(([s, l]) => `${s}=${l.at(-1)}`).join(', ') || 'none'}`)
for (const b of targets) {
  const dir = path.join(QA, b)
  const res = spawnSync('git', ['clean', yes ? '-fdX' : '-ndX', '--', dir], { cwd: REPO, encoding: 'utf8' })
  const n = res.stdout.split('\n').filter(Boolean).length
  console.log(`${yes ? 'cleaned' : 'would clean'} ${b} (${du(dir)}): ${n} ignored path(s)`)
}
if (fs.existsSync(mcpOutput)) {
  console.log(`${yes ? 'removed' : 'would remove'} .playwright-mcp/output (${du(mcpOutput)})`)
  if (yes) fs.rmSync(mcpOutput, { recursive: true, force: true })
}
if (!yes) console.log('Dry run. Re-run with --yes to delete.')
