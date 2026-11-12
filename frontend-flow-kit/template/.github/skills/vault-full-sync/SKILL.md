---
name: vault-full-sync
description: "Audit the {{PROJECT_NAME}} Obsidian vault against the current codebase and reconcile drift. Use when: the user asks to sync the vault, verify vault accuracy, find missing or outdated docs, audit documentation, run a full vault check, reconcile vault with code, or after large refactors / merges. Produces a discrepancy report and applies vault updates to bring `{{VAULT_DIR}}/` back in sync. Orchestrates vault-search and vault-write."
argument-hint: "Optional scope (e.g. area, component, folder) and any extra context, links, or code references"
---

# Vault Full Sync

End-to-end audit of `{{VAULT_DIR}}/` against the current state of the {{PROJECT_NAME}} codebase. Identifies missing, outdated, or contradictory notes and reconciles them via `vault-write`. Always ends with a written report.

## Source of rules

This skill does NOT hardcode vault rules. Every structural rule — frontmatter, folder layout, tag taxonomy, link requirements, hard rules, "when to update" triggers — lives in `.github/instructions/vault.instructions.md`.

**Before doing anything else, read `.github/instructions/vault.instructions.md` in full at runtime** and apply whatever rules it currently contains. If this skill and that file ever appear to disagree, the instructions file wins. Do not rely on rule text quoted in this skill — always re-read the source.

## Required tools

```bash
brew install ripgrep
```

## Inputs

- `scope` — optional: area, component, project, or vault folder to audit. If omitted, audit the whole vault.
- `context` — optional: free-text description of recent changes, focus areas, or known gaps.
- `references` — optional: links to official docs, code paths, PRs, or snippets the user wants reconciled.

## Procedure

### 1. Load the vault rules

Read `.github/instructions/vault.instructions.md` in full. Treat its current contents as the authoritative spec for frontmatter, folder structure, tag taxonomy, hard rules, and "when to update" triggers throughout this run. Do not skip this step even if you think you remember the rules.

### 2. Clarify before auditing

Before reading anything else, evaluate whether the inputs are sufficient:

1. If `scope` is missing or ambiguous (e.g. "everything" with no further hints), ask the user to confirm scope and priority areas.
2. If the user provided claims that conflict with the obvious code reality, do not assume — ask them to clarify or provide a code reference.
3. If the change involves an external system, integration, or third-party API, ask for **official documentation links** and any relevant code snippets or request samples.
4. Only proceed once the scope and source-of-truth inputs are clear. Do not fabricate intent.

Use the `vscode_askQuestions` tool when available; otherwise ask in chat. Do not silently guess.

### 3. Load the source of truth

Read the canonical sources for the scope, in this order:

1. The codebase (source folders listed in `01_Project/Repository-Structure`) — the implementation. Treat as authoritative for behavior.
2. User-provided `references` — official docs, snippets, links.

Vault notes are NEVER the source of truth in this skill. They are the artifact being verified.

### 4. Snapshot the current vault state

For the chosen scope:

1. Load `00_Index/Navigation.md`, `00_Index/Tags.md`, `00_Index/Home.md`, and `07_Templates/` live (do not cache).
2. Run `vault-search` with the scope's keywords to collect all candidate notes.
3. Build a list of `(note path, type, last updated, key claims)` covering the audited area.

### 5. Diff vault against code

For each scoped concern (component, flow, entity, runbook, etc.), classify into one of:

| Category | Meaning |
|----------|---------|
| `missing` | Code exists, no vault note describes it. |
| `outdated` | Vault note exists but contradicts current code. |
| `incomplete` | Vault note exists but omits a material aspect now present in code. |
| `orphaned` | Vault note describes code that no longer exists or was removed. |
| `unlinked` | Note exists and is correct, but missing from `Navigation.md` or lacks expected `[[wikilinks]]`. |
| `mistagged` | Tags do not match `00_Index/Tags.md`, or are missing required `type/*` / `area/*`. |
| `aligned` | Vault matches code. No action needed. |

Apply the hard rules from `.github/instructions/vault.instructions.md` (loaded in step 1) when classifying — do not rely on a copy of those rules in this skill.

### 6. Reconcile via vault-write

For every non-`aligned` finding that is actionable:

1. Load and execute `.github/skills/vault-write/SKILL.md`.
2. Pass it the topic, intended folder, and the corrected content.
3. Let `vault-write` handle template selection, filename casing, frontmatter, cross-linking, `Navigation.md`, and `Tags.md` updates per the rules in `vault.instructions.md`.
4. For `orphaned` notes describing removed code, prefer updating the note to reflect the removal context, or delete it if it is genuinely meaningless. Do not delete silently — list every deletion in the final report.
5. For `unlinked` and `mistagged` notes, the fix is metadata-only: update tags or add the note to the correct `Navigation.md` section.

### 7. Cross-link pass

After applying changes, walk every touched note and verify it satisfies the linking and external-reference rules defined in `.github/instructions/vault.instructions.md` (Related sections, parent linkage, `06_References/` placement of external links, etc.). If those rules have changed since this skill was last edited, follow the file — not this skill.

### 8. Report

Return a single markdown report with these sections:

1. **Scope** — what was audited and what was excluded.
2. **Sources consulted** — code paths, user references, and the loaded `vault.instructions.md` revision (path is enough).
3. **Findings** — table of `note path | category | summary` for every non-`aligned` item.
4. **Changes applied** — bullet list of created / updated / deleted notes, with the chosen `type/*` and key tags, plus any new tags added to `Tags.md` and any new sections added to `Navigation.md`.
5. **Recommendations** — items that need human input (ambiguous behavior, conflicting docs the user must decide on). These are NOT applied automatically.
6. **Follow-ups** — `None` if nothing remains.

## Rules

- Always start by reading `.github/instructions/vault.instructions.md` and apply its current rules. Do not assume the text in this skill is up to date.
- Always delegate the actual write to `vault-write` — do not duplicate its filename, frontmatter, or template logic here.
- Always end with the report, even when nothing changed (state "vault is in sync" with the evidence).
