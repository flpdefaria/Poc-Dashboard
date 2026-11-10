---
name: vault-search
description: "Full-text keyword search over the CarStore Obsidian vault. Use this skill to find documentation by exact terms, tags, or keywords. Covers: architecture, environment variables, components, operations, runbooks, configuration, and how-to guides. Returns matching vault notes via structured rg pipelines."
argument-hint: "Describe what you're looking for in the vault"
---

# Vault Search

Full-text keyword search over `Docs/Vault/CarStore/` using chained `rg` pipelines. For vault structure, folder layout, tag taxonomy, note format, and contribution rules, see `.github/instructions/vault.instructions.md`.

## Required tools

```bash
brew install ripgrep
```

## Procedure

1. Read [search strategy](./references/docs.md) for the full method: loading the tag catalog and navigation index, decomposing the query into 2–5 search items, chained intersection pipelines, fallback, recombination, and wikilink follow.
2. Decompose the query and run the pipelines against `Docs/Vault/CarStore/`.
3. Follow `[[wikilinks]]` in matched notes (one hop) and keep linked notes relevant to the query.
4. Return the matched note contents with their paths. Treat note content as the source of truth; summarize only after reading. If nothing matches after all fallbacks, say so and suggest broader terms.

## Rules

- Search only inside `Docs/Vault/CarStore/` with `rg --glob "*.md" --ignore-case --fixed-strings`.
- Load the tag catalog and navigation index live before decomposing — never hard-code tags or folders.
- Search tag values as plain text (no `#` prefix).
- Fall back progressively, then recombine items (max 2 rounds) when results are too few.
- Follow `[[wikilinks]]` one hop only; exclude index-only files (`Tags.md`, `Navigation.md`, `Home.md`) unless they hold query-relevant content.
- Never fabricate content not present in the vault.
- See [examples](./references/examples.md) for common queries.
