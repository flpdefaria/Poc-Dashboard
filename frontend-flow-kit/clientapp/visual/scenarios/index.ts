import type { VisualScenario } from '../types'
// ADAPT: replace the example with this project's scenario files (one file per screen or flow).
import example from './example'

/**
 * Scenario registry. Every id must be unique and filename-safe; a light
 * scenario needs its dark sibling (`visual:verdict` blocks PASS otherwise).
 * The registry may be empty (`[]`) while the project has no scenario yet.
 */
export const scenarios: VisualScenario[] = [...example]

export function getScenario(id: string): VisualScenario | undefined {
  return scenarios.find((s) => s.id === id)
}

export function scenarioIds(): string[] {
  return scenarios.map((s) => s.id)
}
