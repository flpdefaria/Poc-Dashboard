/**
 * Deterministic API fixtures for the visual harness.
 *
 * `fixtures/*.json` are verbatim snapshots of the seeded API
 * (`Src/CarStore.Domain/Seed/DataSeeder.cs`) taken with `?page=1&pageSize=100`,
 * so every scenario renders the same data the running app shows after a
 * restart. Paged responses for other page sizes are sliced from them here,
 * reproducing `PagedResult<T>` exactly as the API builds it.
 *
 * Refresh: run the app and save `GET /api/<entity>?page=1&pageSize=100` (and
 * `/api/brands/options`) over the matching file. `brands.json` carries
 * `yearsInBusiness`, which the API computes from today's date: refreshing it
 * moves those numbers, so do it deliberately.
 */
import type { BrandDto, BrandOption, CarDto, CustomerDto, PagedResult } from '../../src/types'
import type { ScenarioMock } from '../types'

import carsPage from './fixtures/cars.json' with { type: 'json' }
import brandsPage from './fixtures/brands.json' with { type: 'json' }
import customersPage from './fixtures/customers.json' with { type: 'json' }
import brandOptionsJson from './fixtures/brand-options.json' with { type: 'json' }

export const cars = (carsPage as PagedResult<CarDto>).items
export const brands = (brandsPage as PagedResult<BrandDto>).items
export const customers = (customersPage as PagedResult<CustomerDto>).items
export const brandOptions = brandOptionsJson as BrandOption[]

/** `PagedResult<T>` for one page, built like `PagedResult.Create` on the server. */
export function paged<T>(items: readonly T[], page: number, pageSize: number): PagedResult<T> {
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

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Mock for `GET {apiUrl}?page={page}&pageSize={pageSize}` (`usePagedFetch`). */
export function pagedMock<T>(apiUrl: string, items: readonly T[], pageSize: number, page = 1): ScenarioMock {
  return {
    urlPattern: new RegExp(`${escape(apiUrl)}\\?page=${page}&pageSize=${pageSize}$`),
    status: 200,
    contentType: 'application/json',
    body: paged(items, page, pageSize),
  }
}

export function jsonMock(urlPattern: string | RegExp, body: unknown, status = 200): ScenarioMock {
  return { urlPattern, status, contentType: 'application/json', body }
}

/** Every request `Home.vue` makes on mount. */
export function homeMocks(data = { cars, brands, customers }): ScenarioMock[] {
  return [
    pagedMock('/api/cars', data.cars, 100),
    pagedMock('/api/brands', data.brands, 100),
    pagedMock('/api/customers', data.customers, 100),
    pagedMock('/api/customers', data.customers, 5),
  ]
}

/**
 * Production layout at a desktop viewport: `App.vue` puts the 72px collapsed
 * sidebar next to `<main class="p-10">`, so a page component is
 * `viewport - 72 - 80` px wide. Use it as `mountWidth` to render pages at their
 * real width without the shell.
 */
export function pageWidth(viewportWidth: number): number {
  return viewportWidth - 72 - 80
}

export const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 }
export const PHONE = { width: 390, height: 844, deviceScaleFactor: 2 }
