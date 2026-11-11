import type { Report, Verdict } from './report-types'
export declare function normalizeVerdict(raw: unknown, runDir: string, warnings?: string[]): Verdict
export declare function applyVerdict(runDir: string, rawVerdict: unknown | null): { report: Report; warnings: string[] }
