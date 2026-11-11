#!/usr/bin/env node
/**
 * Cross-platform wrapper: `npm run visual:check:scenario -- <id>[,<id>…]`.
 *
 * Sets VISUAL_SCENARIO before Playwright starts so globalSetup narrows the
 * bundle too (component slug, reference copying, data/*.json) — a bare
 * `--grep` would only skip tests, leaving the bundle claiming scenarios that
 * never ran.
 *
 * With VISUAL_BASELINE_REF set (a git ref or `auto`), the base commit's
 * worktree is prepared first and the run also captures the previous version
 * (see visual/README.md → Baseline). Unset, behaviour is unchanged.
 */
import { parseArgs, runPlaywright } from './lib/launch.mjs'

const { ids, passthrough } = parseArgs()

if (!ids.length) {
  console.error('Usage: npm run visual:check:scenario -- <scenario-id>[,<scenario-id>...]')
  process.exit(2)
}

const baselineRef = process.env.VISUAL_BASELINE_REF?.trim() || null
process.exit(await runPlaywright({ ids, passthrough, baselineRef }))
