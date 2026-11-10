---
applyTo: "Docs/Vault/CarStore/**"
---

# Vault (CarStore) Rules

Obsidian vault for living technical documentation of the CarStore .NET 10 MVC solution, maintained by code agents after code changes.

## Hard Rules

* Never invent content. Only document what is present in the codebase.
* Update the vault after any code change that affects behavior or structure.
* Back domain notes with the codebase implementation as the source of truth.
* Do not add big code snippets. Only relevant lines with `// ...` for omitted parts.
* Always include source file paths when referencing code.
* All notes must be linked to `00_Index/Navigation.md` and tagged according to the taxonomy in `00_Index/Tags.md`.

## When to Update

* New feature, bug fix, refactor, new entity property, changed invariant.
* Undocumented behavior discovered worth recording.
* When adding/removing/upgrading a NuGet package, or changing a `.csproj` reference, update [[Dependencies]] in `01_Project/`.
* When changing domain entities (`Brand`, `Car`, `Customer`) or their invariants, update [[Domain-Overview]] in `03_Domain/`.
* When changing layering rules or the composition root (`Program.cs`), update [[Architecture-Overview]] in `02_Architecture/` and [[Repository-Structure]] in `01_Project/`.

## Note Format

Every note must have YAML frontmatter:

```yaml
---
type: <type>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - note
  - type/<type>
  - area/<area>
---
```

* Keep notes atomic: one topic per note.
* Link to other notes with `[[Note-Name]]`.
* Use the tag taxonomy defined in `00_Index/Tags.md`. Add new tags there first.

## Folder Structure

```
Docs/Vault/CarStore/
├── 00_Index/        // Home, Navigation, Glossary, Tags
├── 01_Project/      // Project-level info: repo structure, dependencies, conventions
├── 02_Architecture/ // Layer responsibilities, patterns, key decisions
├── 03_Domain/       // Entities, relationships, business rules from code
├── 04_Engineering/  // Code style, error handling, validation, pagination, services
├── 05_Operations/   // Build, run, and test procedures
├── 06_References/    // External docs and API references
├── 07_Templates/    // Note templates for consistent authoring
```

## 01_Project Guidance

`01_Project/` documents project-level facts that are **not already captured** in other vault folders. Its purpose is to complement — never duplicate — existing documentation.

**What belongs here:**
* Repository layout and root files (what each file/folder is and why it exists).
* Solution structure and project dependency graph (which `.csproj` references which).
* NuGet package inventory with versions — factual, not analytical.
* Project-wide conventions evident in the codebase (e.g. naming patterns, namespace conventions).
* Key files a new contributor needs to find quickly (`Program.cs`, `CarStoreContext.cs`, etc.).

**What does NOT belong here:**
* Domain language or business rules → `03_Domain/`.
* Architectural decisions or how layers work → `02_Architecture/`.
* Code patterns and conventions → `04_Engineering/`.
* Build, run, and test commands → `05_Operations/`.

**Before adding a note to `01_Project/`, ask:** is this already captured in another vault folder? If yes, link to that source instead of duplicating it. Only write a new note when the information is genuinely absent from all existing documentation.

## Content Guidelines

* Code snippets: only relevant lines with `// ...` for omitted parts.
* Always include the source file path when referencing code.
* Prefer bullet lists and tables over prose.
* Navigation.md must link to ALL notes in the vault. Update it when adding/removing notes.
* When documenting external docs or external links, add a note to `06_References/` with a summary of key points relevant to the project. Link back from the relevant operational/engineering note via `[[Wikilink]]`. Do not embed external links directly in notes outside `06_References/`.
