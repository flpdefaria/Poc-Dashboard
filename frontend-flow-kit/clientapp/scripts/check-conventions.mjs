#!/usr/bin/env node
/**
 * Deterministic convention check for <client app>/src. Part of `npm run verify`.
 * The rules mirror `.github/instructions/frontend.instructions.md` ("Styling rules", "Never").
 *
 *   npm run check:conventions                      exit 1 on any violation, one line per hit
 *   node scripts/check-conventions.mjs <files…>    check only these files (e.g. the touched ones)
 *
 * Comments are ignored, so documented Figma hexes or rule names never count; theme fallbacks inside
 * code (`themeColor("--p-…", "#hex")`) are allowed because only class strings, inline styles and
 * template usage are matched for colours.
 *
 * GENERIC_RULES hold for every project of the frontend flow (PrimeVue + Tailwind v4 + Lucide).
 * PROJECT_RULES are this project's own (add them; `only` limits a rule to matching file paths).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const EXTENSIONS = /\.(vue|ts|tsx|css)$/

const GENERIC_RULES = [
  { id: 'primeicons', re: /\bpi pi-[a-z-]+/, why: 'PrimeIcons are not used: import a Lucide icon from @lucide/vue.' },
  { id: 'bootstrap-icons', re: /\bbi bi-[a-z-]+|\bclass="[^"]*\bbi-[a-z-]+/, why: 'Bootstrap Icons are not used: Lucide only.' },
  { id: 'bootstrap', re: /bootstrap/i, why: 'Bootstrap is not part of the stack.' },
  { id: 'bootstrap-classes', re: /class(?:Name)?=["'`][^"'`]*\b(btn|btn-[a-z]+|form-control|form-select|alert-danger|col-(?:sm|md|lg)-\d+)\b/, why: 'Bootstrap class names: use PrimeVue components, pt and the shared class strings.' },
  { id: 'arbitrary-hex', re: /-\[#[0-9a-fA-F]{3,8}\]/, why: 'Raw hex in a Tailwind class: use a design token (surface-*, text-color, text-muted-color, primary...).' },
  { id: 'inline-hex', re: /style=["'][^"']*#[0-9a-fA-F]{3,8}/, why: 'Raw hex in an inline style: use a token.' },
  { id: 'fixed-color', re: /\b(bg-white|bg-black|text-black|text-white|(?:bg|text|border|ring|fill|stroke)-(?:gray|slate|zinc|neutral|stone)-\d{2,3})\b/, why: 'Fixed colour bypasses light/dark: use surface-*/text-color/text-muted-color tokens.' },
  { id: 'string-icon-prop', re: /<[A-Z][A-Za-z]*[^>]*\s:?icon="/, why: 'PrimeVue string icon prop: pass a Lucide icon through the #icon/#itemicon slot.' },
  { id: 'alert', re: /\balert\(/, why: 'Show API errors with PrimeVue <Message severity="error">, never alert().' },
]

const PROJECT_RULES = [
  // Example (a project that keeps PrimeVue's dark mode off because its dark theme inverts the surface scale):
  // { id: 'dark-mode-selector', re: /darkModeSelector:\s*(?![\sf]|false)/, only: /main\.ts$/,
  //   why: 'Keep darkModeSelector: false (dark = inverted surface scale under html.app-dark).' },
]

const RULES = [...GENERIC_RULES, ...PROJECT_RULES]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : EXTENSIONS.test(e.name) ? [p] : []
  })
}

/** Blank out comments so documented Figma hexes or rule names never count, keeping line numbers. */
function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)))
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => path.resolve(f)).filter((f) => EXTENSIONS.test(f) && fs.existsSync(f))
  : walk(SRC)

const hits = []
for (const file of files) {
  const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n')
  const rules = RULES.filter((rule) => !rule.only || rule.only.test(file.replace(/\\/g, '/')))
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (rule.re.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}  [${rule.id}] ${rule.why}`)
    }
  })
}

if (hits.length) {
  console.error(hits.join('\n'))
  console.error(`\n[check:conventions] ${hits.length} violation(s) in ${files.length} file(s).`)
  process.exit(1)
}
console.log(`[check:conventions] OK: ${files.length} file(s), ${RULES.length} rules.`)
