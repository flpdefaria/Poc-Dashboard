---
name: vault-write
description: "Add or update notes in the CarStore Obsidian vault. Use this skill AFTER making non-trivial code changes to keep documentation in sync. Load and execute this skill to create or update notes for new components, runbooks, decisions, environment variables, architecture changes, or operational procedures. Code changes are incomplete without a vault update."
argument-hint: "Describe the note(s) to create or update"
---

# Vault Write

Create or update notes in `Docs/Vault/CarStore/`. For all structural rules — frontmatter format, folder layout, tag taxonomy, naming conventions, body guidelines, and link requirements — see `.github/instructions/vault.instructions.md`.

## Required tools

```bash
brew install ripgrep
```

## Inputs

- `topic` — what the note is about (normalize to lowercase for searches)
- `content` — note body (free text, sections, bullets)
- `intent` — optional: `add` or `update`; inferred from existence if absent
- `target` — optional: existing note path if already known

## Procedure

1. Read [docs](./references/docs.md) for the commands to load the live folder catalog, tag catalog, available templates, and detect existing notes. **Always load these at runtime — never use cached lists.**
2. **Detect intent** (`add` vs `update`):
   - If `target` is given and the file exists → `update`.
   - Otherwise search first: `rg -l --glob "*.md" --ignore-case --fixed-strings "<topic>" Docs/Vault/CarStore`.
   - One strong match (same scope/topic) → `update`; zero → `add`; multiple → ask the user or treat as `add`.
3. **Decide single vs multiple notes** (atomicity rule: one topic per note). Split when two clearly separable subjects would have distinct `type/*` or `component/*` tags.
4. **For each note:**
   1. Pick the folder from the live structure (see [docs](./references/docs.md) → Structure).
   2. Load the matching template from `07_Templates/`.
   3. Build the filename in `PascalCase-With-Dashes.md` matching existing siblings.
   4. Write frontmatter and body following vault.instructions.md rules and the loaded template.
   5. Add `[[Wikilinks]]` in the `## Related` section pointing to existing relevant notes.
5. **Cross-link**: add a `[[NewNote]]` reference in at least one logical parent note.
6. **Update indexes**: always update `00_Index/Navigation.md`; also update `00_Index/Tags.md` if a new tag was introduced, and `00_Index/Home.md` if a new folder was created.
7. Return a bullet list of each note path created or updated, the `type/*` and key tags chosen, any new tags introduced, and any `TODO:` items left for the caller.

## Rules

- Always search before adding to avoid duplicates.
- Never hard-code folders, tags, or templates — read them live.
- Never invent tags or folders silently — update `00_Index/Tags.md` / `00_Index/Home.md` in the same change.
- **Never embed external links directly in notes outside `06_References/`.** Create a `type/reference` note in `06_References/` with the link and key-point summary, then `[[Wikilink]]` to it from the engineering/operational note.
- See [examples](./references/examples.md) for common scenarios.
