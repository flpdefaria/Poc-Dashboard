/**
 * Deterministic API fixtures and mock helpers for the visual harness.
 *
 * Put snapshots of the real API under `fixtures/*.json` (save the response of
 * the running app, e.g. `GET /api/<entity>?page=1&pageSize=100`) and import
 * them here with `import x from './fixtures/x.json' with { type: 'json' }`.
 * Fixtures never enter production code and never call a real backend.
 */
import type { ScenarioMock } from '../types'

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Any JSON answer (options lists, details, errors). `status` 4xx/5xx reproduces error states. */
export function jsonMock(urlPattern: string | RegExp, body: unknown, status = 200): ScenarioMock {
  return { urlPattern, status, contentType: 'application/json', body }
}

/**
 * ADAPT: the paged response shape this project's API returns, built exactly
 * like the server builds it. The default matches a common .NET `PagedResult<T>`
 * (reference project). Prefer importing the DTO type from `src/types` instead of this
 * local interface.
 */
export interface PagedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** One page of `items`, as the server would return it. */
export function paged<T>(items: readonly T[], page: number, pageSize: number): PagedResponse<T> {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pageNumber: page,
    pageSize,
    totalItems,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  }
}

/**
 * ADAPT: the query string the app's paged fetch sends. Default:
 * `GET {apiUrl}?page={page}&pageSize={pageSize}`.
 */
export function pagedMock<T>(apiUrl: string, items: readonly T[], pageSize: number, page = 1): ScenarioMock {
  return {
    urlPattern: new RegExp(`${escape(apiUrl)}\\?page=${page}&pageSize=${pageSize}$`),
    status: 200,
    contentType: 'application/json',
    body: paged(items, page, pageSize),
  }
}

/**
 * ADAPT: the width a page component really gets at a given viewport, because
 * the preview does not mount the app shell (sidebar, paddings). Subtract the
 * shell's fixed widths. Reference project: 72px collapsed sidebar + `p-10` main
 * (`viewport - 72 - 80`). Use it as `mountWidth` for page scenarios.
 */
export const SHELL_HORIZONTAL_CHROME = 0
export function pageWidth(viewportWidth: number): number {
  return viewportWidth - SHELL_HORIZONTAL_CHROME
}

export const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 }
export const TABLET = { width: 768, height: 1024, deviceScaleFactor: 2 }
export const PHONE = { width: 390, height: 844, deviceScaleFactor: 2 }
/** Figma `get_screenshot` exports at 1x: compare Figma-backed scenarios at this scale. */
export const DESKTOP_1X = { width: 1440, height: 900, deviceScaleFactor: 1 }
