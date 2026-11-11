---
name: carstore-mobile-responsive
description: "Implement or review CarStore tablet and phone layouts (Vue/PrimeVue/Tailwind v4 SPA). Use when: a task asks for responsive behavior, a Figma tablet/phone frame is supplied, or QA must validate widths below desktop. Documents the current desktop-only shell and the rules for adding responsive behavior without breaking it."
argument-hint: "The screen/component and the target widths"
---

# CarStore Mobile and Responsive

Read `.github/instructions/frontend.instructions.md` for the shared styling and token conventions. Apply these rules only within the requested screen. Do not rewrite unrelated screens.

## Current state (verify before relying on it)

- The shell is **desktop-only today**. `App.vue` renders `Sidebar.vue` next to `<main>` at every width. The sidebar is a 72px nav rail (`w-[72px]`) that expands on hover to 240px (`w-60`) as an overlay above `<main>`, without pushing the page. There is no mobile header or drawer.
- Breakpoint utilities are almost unused in the app (only a few `sm:` / `xl:`). There is no `useIsMobile` composable and no custom breakpoint.
- Dialogs built with `dialogShellPt(width)` / `detailsDialogPt(width)` (`components/common/dialog/dialogStyles.ts`) already cap at `max-w-[92vw]`.
- `DataTableCommon.vue` has no phone strategy: all columns render at every width.

## Rules

- Tailwind v4 keeps its default breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Write mobile-first (`base` = phone, then `md:` / `lg:`). Do not add arbitrary breakpoint cuts (`min-[913px]:`).
- **The shell is out of scope** unless the task explicitly asks for a mobile shell (drawer or collapsed-by-default sidebar below a breakpoint). That change touches `App.vue` and `Sidebar.vue` for every page: state it as a shell change in the delivery summary, never slip it in.
- Grids and toolbars: use wrapping flex or `grid-cols-1 md:grid-cols-2 xl:grid-cols-N`. Look at `Home.vue` and `PageHeader.vue` before adding structure.
- Tables: choose an explicit phone strategy per table, and do not squeeze every desktop column into the viewport. The options are internal horizontal scroll (`DataTable` `scrollable`), priority columns hidden below `md`, or a stacked list. Keep server-side paging (`usePagedFetch`) in all of them.
- Dialogs keep `max-w-[92vw]` and need a usable height (`max-h-[90vh]` with an internally scrolling content area) when the content can grow.
- Avoid rigid pixel widths without a `max-w-*`. Interactive controls added or changed need hit areas of at least 44×44px on phones, and text should be at least 12px. If a supplied design is smaller, keep its intent and report the discrepancy.
- Both themes at every width: the dark theme (`html.app-dark`, see `src/style.css`) must stay readable.
- Widths to cover when relevant: 360, 390, 768, 1024 and 1440.

Return the affected widths, structural swaps, table strategy and states with the implementation or review summary. Capture and measurement procedures belong to `frontend-visual-check`.
