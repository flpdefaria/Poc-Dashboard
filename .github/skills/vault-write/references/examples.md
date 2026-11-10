# Example Operations

Tags, folders and templates below exist in the CarStore vault at the time of writing. Always reload `00_Index/Tags.md`, `00_Index/Home.md` and `07_Templates/` before applying a pattern. Commands assume the repo root.

## Example 1: Add a new frontend guide

Request: "Document the dark theme implementation."

1. Check for overlap: `rg -l --glob "*.md" -i -F "dark theme" Docs/Vault/CarStore` → no strong match → `add`.
2. Folder `04_Engineering/`, template `07_Templates/Note-Template.md`, filename `Dark-Theme.md`, matching siblings such as `Sidebar-Collapse-Expand.md`.
3. Frontmatter:
    ```yaml
    ---
    type: guide
    created: 2026-11-10
    updated: 2026-11-10
    tags:
      - note
      - type/guide
      - area/engineering
      - component/web
    ---
    ```
4. Body cites source paths (`Src/CarStore.Web/ClientApp/src/composables/useTheme.ts`, `src/style.css`).
5. Add `[[Dark-Theme]]` to `## Related` of `Frontend-SPA.md`, to `Navigation.md` under `## 04_Engineering`, and to the `04_Engineering` line in `Home.md` → `## Sections`.

## Example 2: Update an existing note

Request: "Customer gained a `Phone` property."

1. `rg -l --glob "*.md" -i -F "entity/customer" Docs/Vault/CarStore` → `03_Domain/Customer.md`, `04_Engineering/Testing.md`.
2. Update `Customer.md` (property + invariant, with the source path `Src/CarStore.Domain/Entities/Customer.cs`). Set `updated:` and keep `created:`.
3. Domain entity changed → also update `[[Domain-Overview]]`, per the "When to Update" rules.

## Example 3: Split into atomic notes

Request: "Document the deploy architecture and the step-by-step deploy."

| File | Folder | Type tag |
|---|---|---|
| `Deployment-Architecture.md` | `02_Architecture/` | `type/overview` |
| `Deployment-Runbook.md` (exists → update) | `05_Operations/` | `type/runbook` |

Each links to the other in `## Related`.

## Example 4: Introduce a new tag

Request: "Tag notes about the QA flow."

1. `rg -i -F "topic/qa" Docs/Vault/CarStore/00_Index/Tags.md` → missing.
2. Add a `### topic/*` section to `Tags.md` with `` - `topic/qa` — frontend visual QA (Playwright) ``, then write the note with that tag.
3. Report the new tag in the summary.

## Example 5: Output summary returned by the skill

```text
Created:
- 04_Engineering/Dark-Theme.md (type/guide, area/engineering, component/web)

Updated:
- 04_Engineering/Frontend-SPA.md (Related link)
- 00_Index/Navigation.md, 00_Index/Home.md

New tags: none
TODOs: none
```
