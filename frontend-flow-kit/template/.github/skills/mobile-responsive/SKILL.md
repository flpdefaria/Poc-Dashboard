---
name: mobile-responsive
description: "Implement or review {{PROJECT_NAME}} tablet and phone layouts (Vue/PrimeVue/Tailwind v4 SPA). Use when: a task asks for responsive behavior, a Figma tablet/phone frame is supplied, or QA must validate widths below desktop."
argument-hint: "The screen/component and the target widths"
---

# Mobile and Responsive

Read `.github/instructions/frontend.instructions.md` for the styling and token conventions. Apply these rules only
within the requested screen; do not rewrite unrelated screens.

## Current state (verify before relying on it)

<!-- ADAPT: describe the shell today: is it desktop-only? How does the navigation behave at small widths? Which
breakpoints are used? Is there a `useIsMobile`-style composable? How do dialogs and tables behave on phones? -->

## Rules

- Tailwind v4 default breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Mobile-first (`base` = phone,
  then `md:` / `lg:`). No arbitrary breakpoint cuts (`min-[913px]:`).
- **The shell (app navigation) is out of scope** unless the task explicitly asks for it. That change affects every
  page: state it as a shell change in the delivery summary.
- Grids and toolbars: wrapping flex or `grid-cols-1 md:grid-cols-2 xl:grid-cols-N`.
- Tables: choose an explicit phone strategy per table (internal horizontal scroll, priority columns hidden below
  `md`, or a stacked list). Keep server-side paging in all of them.
- Dialogs: cap the width (`max-w-[92vw]`) and give a usable height (`max-h-[90vh]` with internal scroll).
- Avoid rigid pixel widths without `max-w-*`. Touch targets ≥ 44×44px on phones, text ≥ 12px. If the design is
  smaller, keep its intent and report the discrepancy.
- Both themes at every width.
- Widths to cover when relevant: 360, 390, 768, 1024, 1440.

Return the affected widths, structural swaps, table strategy and states. Capture and measurement belong to
`frontend-visual-check` (`responsiveCheck: { minTouchTarget: 44 }` on the scenarios).
