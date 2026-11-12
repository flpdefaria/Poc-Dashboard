# Figma references

Two files per scenario, both produced from the Figma MCP by qa-agent:

| File | Content |
|---|---|
| `<scenario-id>.png` | `get_screenshot` export at the scenario's `viewport.deviceScaleFactor` (Figma exports at 1x, so Figma-backed scenarios capture at DPR 1), cropped to the element the scenario's `captureSelector` targets. |
| `<scenario-id>.<section-id>.png` | Optional: `get_screenshot` of a child node, for scenarios with `sections`. |
| `<scenario-id>.figma.json` | Figma spec (`FigmaSpec` in `../types.ts`): source node, frame size, node tree, tokens, texts, PrimeVue mapping, `explanations` and the `checks` the harness asserts against the rendered DOM. See `../README.md` → "Figma reference and spec". |

The usual source is the `.figma-cache/<fileKey>/<nodeId>/` folder the implementer filled with
`figma-discovery`; call the Figma MCP only for what it lacks.

Do **not** drop a screenshot the harness itself produced in here, and do not fill a spec's
`expected` values from the current render. Either would bless the current render as the
design, so every future comparison would pass by construction.

A scenario's status depends on which files exist:
- neither file: `not-applicable`, never `passed`;
- only one of them, and it passes: `partial`.
