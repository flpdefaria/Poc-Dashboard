import type { VisualScenario } from '../types'
import homeDashboard from './home-dashboard'
import entityPages from './entity-pages'

/**
 * Scenario registry. Every id must be unique and filename-safe; a light
 * scenario needs its dark sibling (`visual:verdict` blocks PASS otherwise).
 */
export const scenarios: VisualScenario[] = [...homeDashboard, ...entityPages]

export function getScenario(id: string): VisualScenario | undefined {
  return scenarios.find((s) => s.id === id)
}

export function scenarioIds(): string[] {
  return scenarios.map((s) => s.id)
}
