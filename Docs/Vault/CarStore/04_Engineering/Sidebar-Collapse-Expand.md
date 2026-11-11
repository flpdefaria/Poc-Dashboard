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

# Sidebar Nav Rail (Collapse/Expand on Hover)

On 2026-11-11 `Src/CarStore.Web/ClientApp/src/components/common/sidebar/Sidebar.vue` was rebuilt as the
Figma **nav-rail** in IconOnly layout (file `EOvtzuJAvw1UnoH9tsYmiO`, instance `2005:5267`, component
`2005:1132`, item `2006:205`). It replaces the earlier 78px/278px rail from file `2zyEr3S75NxHIJ5vgTFCWR`.

## Layout

- A fixed `w-[72px]` slot keeps the page in place. The `<aside>` inside it is `absolute`, so when it expands
  to `w-60` (240px) it sits **over** the content (`z-40`, `border-r border-surface-200`, `shadow-lg`) and does
  not push it.
- Background `bg-surface-50` (Figma `#fafafa`), flush to the window edge, full height, no radius.
- Header: 64px (`h-16 px-3`). The 48px logo (`/images/sidebar/minicar.gif`) is a `RouterLink` to `/` with
  `aria-label="CarStore – início"`.
- Items: `<nav aria-label="Navegação principal">`, `px-3 gap-2`. Each row is `h-12` with a 48px icon cell and
  a 24px Lucide icon (`stroke-width` 1.5): `House`, `Car`, `Building`, `IdCard`.
- Selected (2026-11-11, round 3): `bg-navrail-selected text-surface-0 font-semibold`, the Figma blue fill
  (`--p-navrail-item-selected-background`, "Solid" emphasis). Token `--color-navrail-selected` in
  `src/style.css`: `#2564cf` in light (white ink 5.5:1, fill 5.3:1 vs the `#f9fafb` rail), `#7aa7f5` under
  `html.app-dark` (dark `surface-0` ink about 8.3:1, fill about 7.9:1 vs the rail). Others: `text-color`,
  `hover:bg-surface-100`.
- Footer: "Aparência" (opens `ThemeSettingsDialog`) and the "Tema escuro" switch (`aria-pressed`), then a
  `bg-surface-200` divider and the account row (32px `Avatar`, `bg-surface-200`; name/e-mail only when expanded).

## Behavior

- Hovering expands the rail after 300ms and leaving collapses it after 300ms (one shared timer). `Esc`
  collapses it immediately. `motion-reduce:transition-none` turns off the 200ms width animation.
- Keyboard focus never expands the rail. Collapsed rows show their label as a PrimeVue `v-tooltip.right`
  (`{ value, disabled: expanded }`), so the tooltip goes away once labels are visible.
- The active row is still derived from `useRoute().name`.

## Shell

- `Views/Home/Index.cshtml`: `#app` is `flex h-full w-full`, with no padding or gap.
- `App.vue`: `<main>` has `p-10`, the Figma 40px page margin (`2005:5301`).

## Related

- [[Sidebar-Logo-Icon]]
- [[Frontend-SPA]]
- [[Theme-Surface-Modes]]
