/**
 * Typed entry point for the baseline worktree helpers. The implementation is
 * plain ESM (`baseline.mjs`) so the Node launchers can use it without a TS
 * loader; this file only re-exports it for TypeScript consumers.
 */
export {
  BASELINE_PORT,
  BASELINE_ROOT,
  CLIENT_APP_REL,
  baselineWorktreePath,
  prepareBaselineEnv,
  prepareBaselineWorktree,
  removeBaselineWorktree,
  resolveBaselineRef,
  type BaselineDepsStrategy,
} from './baseline.mjs'
