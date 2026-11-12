---
type: index
created: {{TODAY}}
updated: {{TODAY}}
tags:
  - note
  - type/index
---

# Tag Catalog

Authoritative list of tags used across the {{PROJECT_NAME}} vault. Read this file live before tagging any note. Add a
new tag here first, in the same change that uses it.

## Tag catalog

### type/*

- `type/overview` — high-level summary of a folder or area
- `type/index` — navigation/tag/glossary index note
- `type/guide` — how-to or engineering guide
- `type/runbook` — operational step-by-step procedure
- `type/reference` — external documentation or link summary, or a factual component/API reference note
- `type/decision` — a design or architecture decision and its reason
- `type/template` — note template

### area/*

- `area/architecture` — solution layering and structure
- `area/domain` — domain entities and business rules
- `area/engineering` — code style and conventions
- `area/frontend` — Vue/PrimeVue SPA, components, themes, Figma mappings
- `area/qa` — visual harness, QA procedures and findings
- `area/operations` — build, run, test procedures
- `area/project` — repository layout, dependencies, project-level facts

### component/*

- `component/frontend` — the SPA in `{{CLIENT_APP_DIR}}`
<!-- add one component/* tag per backend project or module -->

### Base

- `note` — applied to every note in the vault

## Related

- [[Home]]
