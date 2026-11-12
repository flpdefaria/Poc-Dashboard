import type { VisualScenario } from '../types'
import homeDashboard from './home-dashboard'
import entityPages from './entity-pages'
import customerDialogs from './customer-dialogs'
import carsFigma from './cars-figma'
import legacyDialogs from './legacy-dialogs'
import carsSecondPass from './cars-second-pass'
import carsSearch from './cars-search'
import selectionGuards from './selection-guards'
import brandsFigma from './brands-figma'
import customersFigma from './customers-figma'

/**
 * Scenario registry. Every id must be unique and filename-safe; a light
 * scenario needs its dark sibling (`visual:verdict` blocks PASS otherwise).
 */
export const scenarios: VisualScenario[] = [...homeDashboard, ...entityPages, ...customerDialogs, ...carsFigma, ...legacyDialogs, ...carsSecondPass, ...carsSearch, ...selectionGuards, ...brandsFigma, ...customersFigma]

export function getScenario(id: string): VisualScenario | undefined {
  return scenarios.find((s) => s.id === id)
}

export function scenarioIds(): string[] {
  return scenarios.map((s) => s.id)
}
