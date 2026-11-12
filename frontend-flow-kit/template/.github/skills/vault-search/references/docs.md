
> Examples below come from the reference project (entities Car, Brand, Customer). Replace them with this project's own terms as the vault grows.

# Search Strategy

Commands and strategy for keyword search over `{{VAULT_DIR}}/`. For vault structure, tag taxonomy and note format, see `.github/instructions/vault.instructions.md`. Run all commands from the repo root. Only `rg` (ripgrep) and POSIX tools are required.

## Load reference data first

Always read the tag catalog and the navigation index at runtime. Never hard-code them.

```bash
# Tag values (deduplicated, sorted)
rg -N --no-heading -o '`([a-z]+/[a-z0-9-]+)`' --replace '$1' {{VAULT_DIR}}/00_Index/Tags.md | sort -u

# Values under one prefix (replace `entity`)
awk '/^### entity\/\*/{flag=1;next} /^### /{flag=0} flag' {{VAULT_DIR}}/00_Index/Tags.md \
  | rg -o '`([a-z]+/[a-z0-9-]+)`' --replace '$1'

# Navigation index (all linked notes)
cat {{VAULT_DIR}}/00_Index/Navigation.md

# Notes in a folder
rg --files -g '*.md' {{VAULT_DIR}}/<folder>
```

## Query decomposition

1. Extract the key nouns/concepts as 1–2 word lowercase terms.
2. Match each term against the tag catalog loaded above. The prefixes that exist today are `type/*`, `area/*`, `component/*` and `entity/*`, but read the catalog live because new ones may appear. Examples: `brand` → `entity/brand`, `controller` → `component/web`, `deploy` → `type/runbook`.
3. A term may map to zero, one or several tags. Aim for 2–5 search items and do not over-split.

```
Search Item 1: text="pagination" tags=["area/engineering"]
Search Item 2: text="customer"   tags=["entity/customer"]
```

## Search pipelines

**Chained intersection (primary).** Each pipe narrows the file list. Put the most selective filter (usually a tag) first:

```bash
rg -l --glob "*.md" --ignore-case --fixed-strings "<tag-or-text-1>" {{VAULT_DIR}} \
| xargs rg -l --ignore-case --fixed-strings "<tag-or-text-2>" \
| xargs -I {} sh -c 'echo "\n===== {} ====="; cat "{}"'
```

**Fallback.** If the chain returns nothing, drop the last (least specific) pipe and retry until something matches or one filter remains. Then try each item alone and union the results. Cap noisy queries with `| head -n 5` before the `cat`.

**Recombination (at most 2 rounds).** Use it when you find fewer than 2 content notes:

- Swap tag ↔ text (`entity/car` ↔ `car`).
- Try synonyms (`deploy` → `deployment`, `publish`, `zip`; `chart` → `echarts`, `dashboard`).
- Re-pair items: A→B→C failed, so try A→C and B→C.

## Wikilink follow (one hop)

```bash
rg -o --no-heading '\[\[([^\]|#]+)' --replace '$1' <matched-file>        # extract links
rg --files -g '<Link-Name>.md' {{VAULT_DIR}}                        # resolve path
rg -l --ignore-case --fixed-strings "<any-search-term>" <linked-file>     # relevance check
```

Add a linked note only if it contains at least one search term. Do not follow links inside linked notes. Skip `Tags.md`, `Navigation.md` and `Home.md` unless they hold query-specific content.
