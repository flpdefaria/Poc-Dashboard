---
applyTo: "Src/CarStore.Application/Common/PagedResult.cs,Src/CarStore.Application/Services/*.cs,Src/CarStore.Web/Controllers/Api/**,Src/CarStore.Web/Models/Api/PagedResultDto.cs,Src/CarStore.Web/ClientApp/src/composables/usePagedFetch.ts,Src/CarStore.Web/ClientApp/src/components/common/table/**"
---

# Pagination conventions (server-side only)

Every list is paged on the server and flows: service → API controller → `usePagedFetch` → `DataTableCommon`.
Reuse each layer; never re-implement paging in another one.

## Application layer
- `Application/Common/PagedResult.cs` (exists): `Items`, `PageNumber` (1-based), `PageSize`, `TotalItems`, plus computed `TotalPages`, `HasPrevious` and `HasNext`.
- Each service exposes `Task<PagedResult<T>> GetPagedAsync(int pageNumber, int pageSize)`:
  - Clamp with `pageNumber = Math.Max(1, pageNumber)` and `pageSize = Math.Clamp(pageSize, 1, 100)`.
  - Use a deterministic `OrderBy(...)` before paging, so pages are stable.
  - Run `CountAsync()` over the same base query, then `Skip((pageNumber - 1) * pageSize).Take(pageSize)` before materializing.
  - Never load the full table into memory to paginate.

## API controllers (`Controllers/Api/*ApiController.cs`)
- `GET /api/<feature>?page=1&pageSize=10` (defaults `page = 1`, `pageSize = 10`) calls `GetPagedAsync` and maps to `PagedResultDto<TDto>` with all seven fields, copied from `PagedResult<T>` (never recomputed).
- Dropdown/lookup data uses a dedicated unpaged endpoint (e.g. `GET /api/brands/options`), never a full paged fetch.

## Front-end
- `composables/usePagedFetch.ts` calls `GET {apiUrl}?page=&pageSize=` and exposes `items`, `totalRecords`, `loading`, `error` and `load(page, pageSize)`.
- `components/common/table/DataTableCommon.vue` renders PrimeVue `DataTable` with `lazy` + `paginator` (default `rows: 10`, options `[10, 20, 50]`) and calls `load` on every page change.
- `PagedResult<T>` in `ClientApp/src/types.ts` mirrors the DTO (camelCase).

## What not to do
- Do not add a NuGet or npm pagination package.
- Do not paginate on the client (never fetch all rows and slice them in the browser).
- Do not duplicate paging logic in an API controller or a Vue component.
- Do not change the `page`/`pageSize` query names; `usePagedFetch` depends on them.
