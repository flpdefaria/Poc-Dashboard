import type { QaDifference, QaFindings, Report } from './report-types'
export declare const CATEGORIES: string[]
export declare function evidenceExists(runDir: string, relative: unknown): boolean
export declare function collectDifferences(report: Report, runDir: string): QaDifference[]
export declare function buildFindings(report: Report, runDir: string): QaFindings
export declare function writeFindings(runDir: string, findings: QaFindings): void
