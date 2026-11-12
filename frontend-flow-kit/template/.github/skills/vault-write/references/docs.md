# Write Reference

Commands for creating and updating vault notes. For structure, tag taxonomy, note format and contribution rules, see `.github/instructions/vault.instructions.md`. Only `rg` (ripgrep) and POSIX tools are required. Always read the live sources below and never use cached lists.

## Folder catalog

```bash
# Folder → purpose (authoritative description)
sed -n '/^## Sections/,/^## Related/p' {{VAULT_DIR}}/00_Index/Home.md

# Folders on disk (top level + one nested level)
find {{VAULT_DIR}} -mindepth 1 -maxdepth 2 -type d -not -path '*/.obsidian*'

# Notes in a folder, before naming a new sibling
rg --files -g '*.md' {{VAULT_DIR}}/<folder>
```

`Home.md` → `## Sections` lists one line per folder (`` - `NN_Name` — purpose ``), with two-digit prefixes to keep the listing sorted.

## Templates

```bash
rg --files -g '*.md' {{VAULT_DIR}}/07_Templates
```

Today there is a single generic `Note-Template.md`. If a `template-<type>.md` matching the chosen `type/*` appears later, prefer it. Otherwise use the generic template. After reading it:

- Replace `{{title}}`, and set `created:`/`updated:` to today (`YYYY-MM-DD`).
- Replace `type/template` with the real `type/*` and add the `area/*`, `component/*` and `entity/*` tags.
- Fill `## Context` / `## Details`, and point `## Related` to existing notes via `[[Wikilinks]]`.

## Tag taxonomy

```bash
cat {{VAULT_DIR}}/00_Index/Tags.md                                   # full, with descriptions
rg -N --no-heading -o '`([a-z]+/[a-z0-9-]+)`' --replace '$1' {{VAULT_DIR}}/00_Index/Tags.md | sort -u
```

`Tags.md` → `## Tag catalog` → `### <prefix>/*` headers, one `` - `prefix/value` — description `` per line, and `### Base` for `note`. A new tag goes there first, in the same change.

## Detect existing notes

```bash
rg -l --glob "*.md" --ignore-case --fixed-strings "<topic>" {{VAULT_DIR}}
```

Also check that every note in the folder appears in `00_Index/Navigation.md` and `Home.md` → `## Sections`. Fix any gap you touch.
