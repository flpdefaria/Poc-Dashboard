# Figma references

Two files per scenario, both produced from the Figma MCP by qa-agent:

| File | Content |
|---|---|
| `<scenario-id>.png` | `get_screenshot` export at the scenario's `viewport.deviceScaleFactor`, cropped to the element the scenario's `captureSelector` targets. |
| `<scenario-id>.figma.json` | Figma spec: source node, frame size, node tree, tokens, texts, Code Connect, PrimeVue mapping and the `checks` the harness asserts against the rendered DOM. See `../README.md` → "Figma spec". |

Do **not** drop a screenshot the harness itself produced in here, and do not fill a spec's
`expected` values from the current render. Either would bless the current render as the
design, so every future comparison would pass by construction.

A scenario's status depends on which files exist:
- neither file: `not-applicable`, never `passed`;
- only one of them, and it passes: `partial`.
