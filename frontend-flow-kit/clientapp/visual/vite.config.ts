import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ConfigEnv, type Plugin, type UserConfig } from 'vite'
import clientConfig from '../vite.config'
import { DEFAULT_PREVIEW_PORT, REPO_ROOT, USES_HTTPS } from './lib/project.mjs'

const clientRoot = fileURLToPath(new URL('../', import.meta.url))
const visualDir = fileURLToPath(new URL('./', import.meta.url))
/** Repository root, from `clientAppDir` in `visual/project.json`. */
const repoRoot = REPO_ROOT

/** `--port N` passed on the CLI (the baseline server runs on 5174). */
function cliPort(): number | null {
  const i = process.argv.indexOf('--port')
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN
  return Number.isFinite(value) && value > 0 ? value : null
}

const ABSENT_PREFIX = '\0visual-absent-at-base:'
const RESOLVABLE_EXTENSIONS = ['', '.ts', '.js', '.vue', '.mjs', '/index.ts', '/index.js']

function normalized(p: string): string {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase()
}

/**
 * Baseline server only. The overlaid (current) scenarios may import
 * components that do not exist at the base commit; Vite would otherwise fail
 * to transform the whole scenario registry and break every baseline capture.
 * A missing local import from `visual/` becomes a module that throws at
 * runtime, so only that scenario's loader rejects (→ `absent-at-base`).
 */
function absentAtBasePlugin(): Plugin {
  const visualRoot = normalized(visualDir)
  return {
    name: 'visual-absent-at-base',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer || !normalized(importer).startsWith(visualRoot)) return null
      const bare = source.split('?')[0]
      if (!bare.startsWith('.') && !path.isAbsolute(bare)) return null
      const file = path.resolve(path.dirname(importer.split('?')[0]), bare)
      if (file.includes('node_modules')) return null
      // Only local source files are checked; everything else resolves as usual.
      if (!normalized(file).startsWith(normalized(repoRoot))) return null
      if (RESOLVABLE_EXTENSIONS.some((ext) => fs.existsSync(file + ext))) return null
      return ABSENT_PREFIX + file.replace(/\\/g, '/')
    },
    load(id) {
      if (!id.startsWith(ABSENT_PREFIX)) return null
      const missing = id.slice(ABSENT_PREFIX.length)
      return `throw new Error(${JSON.stringify(`[visual-absent-at-base] ${missing} does not exist at the base commit`)})\nexport default undefined\n`
    },
  }
}

// Only the screenshot server loads this config. Production aliases/builds are untouched.
export default defineConfig(async (env: ConfigEnv) => {
  const base = (typeof clientConfig === 'function' ? await clientConfig(env) : clientConfig) as UserConfig
  const isBaseline = process.env.VISUAL_BASELINE_SERVER === '1'

  // Production config hardcodes port/origin 5173. Follow a CLI override so
  // dev asset URLs point at THIS server (preview 5175, baseline 5174).
  const visualPort = cliPort() ?? (Number(process.env.VISUAL_PORT ?? process.env.VISUAL_DEV_PORT) || DEFAULT_PREVIEW_PORT)

  // With a node_modules symlink (baseline worktree), resolved dependency
  // paths live outside the worktree root; allow their real location too.
  const nodeModules = path.join(clientRoot, 'node_modules')
  const allow = [repoRoot]
  if (fs.existsSync(nodeModules)) allow.push(fs.realpathSync(nodeModules))

  return {
    ...base,
    // The preview is served from "/" (the production build base is "/dist/").
    base: '/',
    ...(process.env.VISUAL_VITE_CACHE_DIR ? { cacheDir: process.env.VISUAL_VITE_CACHE_DIR } : {}),
    plugins: [...(base.plugins ?? []), ...(isBaseline ? [absentAtBasePlugin()] : [])],
    resolve: {
      ...base.resolve,
      dedupe: ['vue', 'vue-router', 'primevue', '@primeuix/themes'],
    },
    server: {
      ...base.server,
      port: visualPort,
      strictPort: true,
      origin: `${USES_HTTPS ? 'https' : 'http'}://localhost:${visualPort}`,
      fs: { allow },
    },
  }
})
