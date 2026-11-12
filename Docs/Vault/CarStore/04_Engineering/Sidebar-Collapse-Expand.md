---
type: guide
created: 2026-09-17
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# Sidebar Nav Rail (Fixed, Icon-Only)

On 2026-11-11 `Src/CarStore.Web/ClientApp/src/components/common/sidebar/Sidebar.vue` was rebuilt as the
Figma **nav-rail** in IconOnly layout (file `EOvtzuJAvw1UnoH9tsYmiO`, instance `2005:5267`, component
`2005:1132`, item `2006:205`). It replaces the earlier 78px/278px rail from file `2zyEr3S75NxHIJ5vgTFCWR`.

## Layout

- The `<aside>` is a fixed `w-[72px]` column in normal flow. It **never expands**: Figma shows only the
  IconOnly layout, so there is no hover/Esc behavior, no overlay and no 240px state.
- Background `bg-surface-50` (Figma `#fafafa`), flush to the window edge, full height, no radius.
- Header: 64px (`h-16`). The 48px logo (`/images/sidebar/minicar.gif`) is a `RouterLink` to `/` with
  `aria-label="CarStore – início"`.
- Items: `<nav aria-label="Navegação principal">`, `px-3 gap-2`. Each item is a 48px square (`size-12`) with a
  24px Lucide icon (`stroke-width` 1.5): `House`, `Car`, `Building`, `IdCard`.
- Selected: `bg-navrail-selected text-surface-0` plus `aria-current="page"`, the Figma blue fill
  (`--p-navrail-item-selected-background`, "Solid" emphasis). Token `--color-navrail-selected` in
  `src/style.css`: `#2564cf` in light (white ink 5.5:1, fill 5.3:1 vs the `#f9fafb` rail), `#7aa7f5` under
  `html.app-dark` (dark `surface-0` ink about 8.3:1, fill about 7.9:1 vs the rail). Others: `text-color`,
  `hover:bg-surface-100`.
- Footer: "Aparência" (opens `ThemeSettingsDialog`, surface mode only) and the "Tema escuro" icon button
  (`Moon`/`Sun`, `aria-pressed`, no switch track; the only light/dark control in the app), then a
  `bg-surface-200` divider and the account avatar (32px `Avatar`, `bg-surface-200`, no name/e-mail text).

## Behavior

- Every item (logo "CarStore", nav items, "Aparência", "Tema escuro", account avatar) shows its label as a
  PrimeVue `v-tooltip.right` on hover and keyboard focus. Icon-only rows keep an `aria-label`.
- The active item is derived from `useRoute().name`.

## Shell

- `Views/Home/Index.cshtml`: `#app` is `flex h-full w-full`, with no padding or gap.
- `App.vue`: `<main>` has `p-10`, the Figma 40px page margin (`2005:5301`).

## Related

- [[Sidebar-Logo-Icon]]
- [[Icon-Motion]]
- [[Frontend-SPA]]
- [[Theme-Surface-Modes]]
