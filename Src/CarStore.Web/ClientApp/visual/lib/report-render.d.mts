import type { Report } from './report-types'

export declare function escapeHtml(value: unknown): string
export declare const REPORT_STYLES: string
export declare function runHtml(report: Report, runName: string): string
export declare function rebuildRootIndex(artifactRoot: string): void
export declare function writeRunPages(runDir: string, report: Report, artifactRoot: string): void
export declare function reportSummary(report: Report): {
  combos: ({ combo: string; scenarios: string[] } & ReportCounts)[]
  total: ReportCounts
  unclassified: { scenario: string; nodeId: string; selector: string; prop: string; status: string }[]
}
export interface ReportCounts {
  nodes: number; checks: number; pass: number; fail: number; missing: number; dynamic: number
  secTotal: number; secOk: number; secFail: number; secDynamic: number; secDataDriven: number; secPartialRegion: number
  items: number; byCategory: Record<string, number>
}
export declare function deviceFromWidth(width: number): 'desktop' | 'tablet' | 'mobile'
