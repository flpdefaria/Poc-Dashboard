---
name: CarStore
description: A quiet, dark-slate showroom console for browsing and managing brands, cars, and customers.
colors:
  surface-0: "var(--p-surface-0)"
  surface-50: "var(--p-surface-50)"
  surface-100: "var(--p-surface-100)"
  surface-300: "var(--p-surface-300)"
  surface-500: "var(--p-surface-500)"
  surface-700: "var(--p-surface-700)"
  surface-800: "var(--p-surface-800)"
  text-color: "var(--p-text-color)"
  text-muted-color: "var(--p-text-muted-color)"
  primary: "var(--p-primary-color)"
  primary-400: "var(--p-primary-400)"
  primary-emphasis: "var(--p-primary-emphasis)"
  primary-contrast: "var(--p-primary-contrast)"
  danger: "#ef4444"
  danger-emphasis: "#dc2626"
typography:
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "normal"
  brand-mark:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 900
    lineHeight: 1
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "21px"
  full: "9999px"
spacing:
  xs: "7px"
  sm: "10.5px"
  md: "17.5px"
  lg: "21px"
components:
  button-primary:
    backgroundColor: "{colors.surface-700}"
    textColor: "{colors.surface-0}"
    rounded: "{rounded.md}"
    padding: "8px 11.5px"
  button-primary-hover:
    backgroundColor: "{colors.surface-800}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-color}"
    rounded: "{rounded.md}"
    padding: "8px 11.5px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 11.5px"
  dialog-shell:
    backgroundColor: "{colors.surface-0}"
    rounded: "{rounded.pill}"
  nav-item-active:
    backgroundColor: "{colors.surface-800}"
    textColor: "{colors.surface-0}"
    rounded: "{rounded.lg}"
---

# Design System: CarStore

## Overview

**Creative North Star: "The Premium Showroom"**

CarStore reads like the back office of a high-end dealership: quiet, confident, and almost entirely monochrome, with a single deep-slate accent reserved for the actions that matter (primary CTAs, the active nav item). The system is sophisticated and restrained rather than loud - no bright brand color, no decorative gradients, no visual noise competing with the inventory data itself. Density stays moderate: generous internal padding on cards, dialogs and the sidebar, but a compact `text-sm` baseline everywhere so tables of cars/brands/customers stay scannable.

**Key Characteristics:**
- Monochrome-first: nearly the entire UI lives on the `surface-0` -> `surface-800` neutral scale.
- One accent, used sparingly: solid `surface-700`/`surface-800` (dark slate) marks the primary action and the active nav item only.
- Soft geometry: generously rounded corners everywhere (`rounded-xl` cards/sidebar, `rounded-[21px]` dialogs, full-round nav icons/pagination).
- Flat by default: borders (`border-surface-300`) and subtle surface-tint layering carry separation, not shadows.

## Colors

The palette is almost entirely neutral; color is a signal, not decoration.

### Primary
- **Surface 700 / Surface 800** (`var(--p-surface-700)` / `var(--p-surface-800)`): the one deliberate accent. Used for primary action buttons ("New Car", "New Brand", "New Customer", dialog confirm actions) and the active sidebar nav item. `surface-800` is the hover/pressed state of `surface-700`.

### Neutral
- **Surface 0** (`var(--p-surface-0)`): page and dialog background; the base the whole app sits on.
- **Surface 50 / Surface 100** (`var(--p-surface-50)` / `var(--p-surface-100)`): sidebar background, hover states on secondary controls, avatar panel background.
- **Surface 300** (`var(--p-surface-300)`): the only border color in the system (cards, table shell, dialog shell, menus, secondary buttons).
- **Surface 500**: reserved neutral step for future mid-tone needs.
- **Text Color / Muted Text Color** (`var(--p-text-color)` / `var(--p-text-muted-color)`): primary copy vs. secondary/meta copy (e.g. sidebar email, table pagination labels).

### Accent (component default, not brand)
- **Primary / Primary 400 / Primary Emphasis** (`var(--p-primary-color)` etc., PrimeVue Aura default): only surfaces through untouched PrimeVue defaults - focus rings (`focus:ring-primary-400`) and the legacy Razor `.btn-primary`/`.form-control` classes kept for the Customers forms. Never used as the app's visual identity color.

### Data palette: Paint Swatches
Five automotive paint colors, defined as Tailwind `@theme` tokens in `ClientApp/src/style.css` (`bg-paint-*`, `text-paint-*`, with `/5`-`/12` tints): **Gulf** `#2f6f9f`, **Racing Green** `#2e6b4f`, **Bronze** `#9a6a1c`, **Burgundy** `#8e2f52`, **Graphite** `#475569`. Each holds at least 4.5:1 on white and 3:1 on its own 12% tint.
- **Data categories:** fleet-by-brand mix bar, brand dots and share bars, in rank order (Gulf, Green, Bronze, Burgundy, Graphite). Values are always labeled; color is never the only cue.
- **Metric identity:** each Home KPI card carries one swatch as a 5% card tint plus a 12% icon tile (Fleet value Bronze, Cars in stock Gulf, Registered customers Green, Availability Graphite).
- **Charts:** bar series use Gulf (`BarChart` `color-var`), not the Aura primary.

### Dark theme: "Showroom After Hours"
Toggled from the sidebar ("Dark theme" switch or the "Appearance" dialog; persisted in `localStorage` as `carstore-theme`, defaulting to the OS preference; applied before first paint by an inline script in `_Layout.cshtml`). The neutral scale follows a **surface mode** borrowed from the Atlas app (Prometheus design system): `gray` (default), `neutral`, `slate`, `stone` or `zinc`, chosen in the Appearance dialog and persisted as `carstore-surface`. PrimeVue's primary scale aliases the surface scale (Atlas "Noir" monochrome primary), so focus rings, selection and checkboxes share the neutral accent instead of Aura's emerald. Dark inverts the `--p-surface-*` scale under `html.app-dark` from the active mode: canvas `surface-0` = mode 950; cards/sidebar one step up (`surface-50/100`); muted text `surface-500` = mode 400 (>= 7:1); body text `surface-700` = mode 200 (>= 14:1). The accent becomes a light fill with dark text (primary buttons use `text-surface-0`, never PrimeVue's fixed white). Paint swatches have lifted dark variants (each >= 7:1 on the canvas); status tags/messages use tinted fills with light ink. Theme switches play a circular reveal from the toggle (View Transitions), instant under reduced motion.

### Danger
- **Danger** (`#ef4444`) / **Danger Emphasis** (`#dc2626`): delete actions and validation error text/background only.

### Named Rules
**The One Accent Rule.** `surface-700`/`surface-800` is the only color that means "act here." It appears on at most one primary button per view and the single active nav item - never on illustrative or decorative elements.

**The Paint-Means-Data Rule.** Paint swatches encode data categories and metric identity only. They never fill buttons, links, nav items or focus states, so they never compete with slate for "act here."

## Typography

**Body Font:** system-ui stack (no custom web font loaded)
**Character:** Plain and utilitarian - the system leans on scale and weight, not typeface personality, to build hierarchy.

### Hierarchy
- **Brand mark** (`font-black`, 22px, line-height 1): the "CarStore" wordmark in the sidebar only.
- **Title** (`text-sm font-semibold`/`font-medium`): dialog headers, nav labels, table primary column.
- **Body** (`text-sm`, 400): table cells, form values, dialog content - the app-wide baseline.
- **Label / Muted** (`text-xs`, muted color): secondary meta text (sidebar subtitle/email, pagination captions).

### Named Rules
**The One Baseline Rule.** Nearly everything renders at `text-sm`; hierarchy comes from `font-weight` and color (text vs. muted), not from a large type scale.

## Layout

Sidebar + content shell: a fixed-width collapsible rail (`78px` collapsed / `278px` expanded on hover) plus a fluid content area (`App.vue`: `flex h-full w-full gap-3 p-4`). Internal spacing runs on a near-8px-with-half-step rhythm drawn straight from Figma specs (`17.5px`, `21px`, `10.5px`), not the default Tailwind scale - arbitrary values are expected here, not a smell. Tables and dialogs are the two structural containers: a bordered rounded shell wrapping a `DataTable` (paginator right-aligned, flat nav buttons) or a rounded dialog shell (67px header, footer button row).

## Elevation & Depth

**The Flat-By-Default Rule.** No box-shadows anywhere in the system. Every surface separation - sidebar from content, table from page, dialog from backdrop, menu from page - is carried by a `border-surface-300` hairline and/or a one-step surface-tint shift (e.g. `surface-100` sidebar on `surface-0` page). Depth is implied by layering flat tinted panels, never by shadow.

## Shapes

Corners are soft and consistently rounded, scaling with the container's importance: `rounded-lg` (nav items, small controls) -> `rounded-xl` (sidebar, table shell, menus, avatar panel) -> `rounded-[21px]` (dialogs, the largest overlay surface). Circular geometry (`rounded-full`) is reserved for icon-only controls: pagination nav buttons/page numbers and the user avatar.

## Components

### Buttons
- **Shape:** `rounded-md!` (8px), never the dialog's larger radius.
- **Primary:** solid `surface-700` background, `surface-0` text, `border-surface-700`; used once per view for the single most important action.
- **Hover / Focus:** primary hovers to `surface-800`; no scale/shadow transition, only a background-color step.
- **Secondary / Danger:** secondary is bordered (`border-surface-300`), transparent background, default text color; danger reuses the same shape/padding with red background - both are visually quieter than primary by design.

### Cards / Containers (table shell)
- **Corner Style:** `rounded-xl`.
- **Background:** `surface-0`.
- **Shadow Strategy:** none - see Elevation & Depth.
- **Border:** `border-surface-300` on all four sides.

### Dialogs
- **Shape:** `rounded-[21px]` panel, `max-w-[92vw]`, `border-surface-300`.
- **Header:** fixed 67px height, title left, close action right.
- **Footer:** right-aligned 3-gap (`gap-3`) button row; confirm action uses the primary button style, cancel uses secondary.
- **Content:** form dialogs use a looser `21px` gap; read-only "Details" dialogs use a tighter `7px` gap with denser padding.

### Menus (row actions)
- **Style:** `rounded-xl` white panel, `border-surface-300`, `4px`/`8px` list padding, `2px` item gap; items are plain rows (icon + label), no dividers.

### Navigation (sidebar)
- **Style:** collapsible rail, `rounded-xl` shell on `surface-100`; inactive items sit flush on the same surface, the active item is the one place `surface-800` fills a full row (`rounded-lg`); hover on inactive items steps to `surface-50`.
- **Mobile / narrow:** collapsed state (78px, icon-only) is the resting state; hover expands to the labeled 278px rail - there is no separate off-canvas/mobile pattern yet.

### Pagination
- **Style:** flat, borderless circular nav/page buttons (`rounded-full`, transparent background); the active page is marked by bolder text color only, never a filled background - consistent with the "no decorative fills" posture of the rest of the system.

## Do's and Don'ts

### Do:
- **Do** keep `surface-700`/`surface-800` as the only "act here" color - one primary button per view, one active nav item.
- **Do** separate surfaces with a `border-surface-300` hairline or a one-step surface-tint shift, never a shadow.
- **Do** keep the type scale at `text-sm` baseline with weight/color for hierarchy, not new font sizes.
- **Do** use full-round shapes only for icon-only controls (pagination, avatar); everything else uses `rounded-md/lg/xl`.

### Don't:
- **Don't** introduce a second action/brand accent color or a gradient - actions stay neutral-plus-one-accent; color beyond slate belongs to the Paint Swatches data palette only.
- **Don't** add `box-shadow` to cards, dialogs, or menus - it breaks the flat-by-default rule.
- **Don't** let the PrimeVue Aura default "primary" (green) accent leak into new components - it is a component-default fallback (focus rings, legacy Razor forms), not the brand color.
- **Don't** shrink the dialog's `rounded-[21px]` or the table shell's `rounded-xl` to match the button's `rounded-md` - radius scales with container size on purpose.
