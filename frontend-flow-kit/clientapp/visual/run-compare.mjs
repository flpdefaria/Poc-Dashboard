#!/usr/bin/env node
/**
 * 3-way comparison: previous (base commit) × current × Figma reference.
 *
 *   npm run visual:compare                      every scenario, base = auto
 *   npm run visual:compare -- <id>[,<id>…]      named scenarios
 *   VISUAL_BASELINE_REF=<ref> npm run visual:compare -- <id>
 *
 * VISUAL_BASELINE_REF defaults to `auto` (merge-base of HEAD and origin/main,
 * falling back to main). The worktree under <repo>/.visual-baseline/ is
 * removed afterwards unless VISUAL_KEEP_BASELINE=1.
 */
import { parseArgs, runPlaywright } from './lib/launch.mjs'

const { ids, passthrough } = parseArgs()
const baselineRef = process.env.VISUAL_BASELINE_REF?.trim() || 'auto'

process.exit(await runPlaywright({ ids, passthrough, baselineRef }))
