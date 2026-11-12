
> Examples below come from the reference project (entities Car, Brand, Customer). Replace them with this project's own terms as the vault grows.

# Example Queries

All commands run from the repo root. Tags shown here exist in `00_Index/Tags.md` at the time of writing, but always reload the catalog before relying on them.

## Example 1: "How does paging work between the API and the Vue tables?"

```
Search Item 1: text="pagination"   tags=["area/engineering"]
Search Item 2: text="usePagedFetch"
Search Item 3: text="api"          tags=["component/web"]
```

```bash
rg -l --glob "*.md" -i -F "pagination" {{VAULT_DIR}} \
| xargs rg -l -i -F "usePagedFetch" \
| xargs -I {} sh -c 'echo "\n===== {} ====="; cat "{}"'
```

Expected hits: `04_Engineering/Pagination.md`, then one hop to `Frontend-SPA.md` / `Controllers.md` if they mention the terms.

## Example 2: "Business rules for deleting a brand"

```
Search Item 1: text="brand"  tags=["entity/brand"]
Search Item 2: text="delete"
Search Item 3: text="DomainException"
```

```bash
rg -l --glob "*.md" -i -F "entity/brand" {{VAULT_DIR}} \
| xargs rg -l -i -F "delete" \
| xargs -I {} sh -c 'echo "\n===== {} ====="; cat "{}"'
```

If nothing matches, drop `delete` and retry, then follow `[[Domain-Overview]]`.

## Example 3: "Home dashboard chart / sidebar behavior" (frontend)

```bash
rg -l --glob "*.md" -i -F "component/web" {{VAULT_DIR}} \
| xargs rg -l -i -e "echarts" -e "dashboard" -e "sidebar" \
| xargs -I {} sh -c 'echo "\n===== {} ====="; cat "{}"'
```

Expected hits: `Home-Dashboard.md`, `Sidebar-Collapse-Expand.md`, `Sidebar-Logo-Icon.md`, `Frontend-SPA.md`.

## Example 4: "How do I deploy?" (operations, synonym recombination)

```bash
rg -l --glob "*.md" -i -F "type/runbook" {{VAULT_DIR}} | xargs -I {} sh -c 'echo "\n===== {} ====="; cat "{}"'
# Too few results → synonyms
rg -l --glob "*.md" -i -e "deploy" -e "publish" -e "zip" {{VAULT_DIR}}
```

Expected hits: `05_Operations/Deployment-Runbook.md`, plus one hop to `06_References/Azure-App-Service-Docs.md`.
