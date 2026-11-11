---
type: guide
created: 2026-11-11
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# UI Language (pt-BR)

Since 2026-11-11 every user-facing string in the SPA is Brazilian Portuguese. There is no i18n library: the
strings live in the components, and the app runs in one language.

## Where the text lives

- Pages and tables (`components/*Page.vue`, `*Table.vue`): titles, descriptions, "Novo carro/Nova marca/Novo
  cliente", column headers, delete-confirmation texts.
- Dialogs (`components/common/dialog/*`): headers, `FormField`/`DetailField` labels, "Cancelar/Salvar/Fechar/
  Excluir", required-field validation messages. `ThemeSettingsDialog` ("Aparência", "Superfície").
- `common/table/DataTableCommon.vue`: row menu "Detalhes/Editar/Excluir", "Ações", "Excluir selecionados",
  default `searchPlaceholder` "Buscar nesta página…".
- `common/sidebar/Sidebar.vue`, `common/loader/ShowroomLoader.vue`, `Home.vue`.
- `Views/Shared/_Layout.cshtml`: `<html lang="pt-BR">`. `Views/Home/Index.cshtml`: page title "Início".

## Entity nouns with gender (`utils/entityLabel.ts`)

`useEntityCrud` and `useCreateEntity` take `entityLabel: EntityLabel` (`{ singular, plural, feminine? }`)
instead of a plain string, so toasts and fallback errors agree in gender and number:

```ts
export const brandLabel: EntityLabel = { singular: "marca", plural: "marcas", feminine: true };
// ...
summary: `${capitalize(entityLabel.singular)} excluíd${o}`, // "Marca excluída"
```

- Exported labels: `carLabel`, `brandLabel`, `customerLabel`; helpers `genderSuffix`, `capitalize`.
- `requestFailedMessage(status)` ("A requisição falhou (status N).") is the fallback when the API returns no
  `{ message }`; `usePagedFetch` uses it too.

## PrimeVue built-in texts

`src/plugins/primevue-locale-pt-br.ts` (`primeVueLocalePtBr`) is passed as `locale` in `src/main.ts`. PrimeVue
deep-merges it over its English defaults: DatePicker day/month names, empty/filter messages and the paginator
and dialog `aria` labels.

## Not translated

- API error messages come from `DomainException` texts in `CarStore.Domain` (for example "Brand name is
  required.") and are shown as they are. The backend is out of scope for front-end work.
- `Views/Shared/Error.cshtml` (server error page) is still in English.

## Related

- [[Frontend-SPA]]
- [[Home-Dashboard]]
- [[Domain-Overview]]
