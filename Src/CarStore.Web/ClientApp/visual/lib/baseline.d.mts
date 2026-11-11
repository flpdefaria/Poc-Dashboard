export declare const CLIENT_APP_REL: string[]
export declare const CLIENT_APP_ROOT: string
export declare const REPO_ROOT: string
export declare const BASELINE_ROOT: string
export declare const BASELINE_PORT: 5174

export type BaselineDepsStrategy = 'junction' | 'npm-ci'

export declare function resolveBaselineRef(raw?: string): { ref: string; sha: string }
export declare function baselineWorktreePath(sha: string): string
export declare function prepareBaselineWorktree(sha: string): {
  worktreePath: string
  clientAppDir: string
  depsStrategy: BaselineDepsStrategy
  viteCacheDir: string | null
}
export declare function removeBaselineWorktree(worktreePath?: string): boolean
export declare function prepareBaselineEnv(raw?: string): Record<string, string>
