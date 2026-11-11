// Shared action-button classes (Figma contrast primary action + neutral secondary/outlined),
// reused by dialog footers, page header "New X" buttons, and the Home page CTAs.
const buttonBaseClass = "gap-1.75! rounded-md! px-[11.5px]! py-2! text-sm! font-medium!";
// Figma "button-small" (dashboard node 2009:385): 32px tall, 12px label, 12px side padding (+1px border),
// 16px icon (`--p-button-sm-icon-size`; the `.lucide` 1em rule alone would make it 12px).
const buttonSmallBaseClass = "h-8! gap-2! rounded-md! px-3! py-0! text-xs! font-medium! [&_.lucide]:size-4!";
// Figma "button" default size (Prometheus node 2005:2857, Cars frame 2063:4): 40px tall = 1px border +
// 8.5px padding + 21px line (14px label at 1.5), 16px side padding inside the border, 8px gap, 16px icon.
const buttonMdBaseClass =
  "h-10! gap-2! rounded-md! px-4! py-0! text-sm! leading-[21px]! font-medium! [&_.lucide]:size-4!";

// Figma's near-black contrast fill (#0a0a0a) is the preset's monochrome primary (`primary.950`,
// see plugins/primevue-preset.ts): near-black in light, the white end of the inverted ramp in
// dark, with `primary-contrast` (surface-0) as the label. `!` beats PrimeVue's own primary
// Button colors, which are injected after Tailwind.
const primaryColorClass =
  "border-primary! bg-primary! text-primary-contrast! hover:border-primary-emphasis! hover:bg-primary-emphasis!";

export const secondaryButtonClass = `${buttonBaseClass} border-surface-300!`;
export const primaryButtonClass = `${buttonBaseClass} ${primaryColorClass}`;
export const primarySmallButtonClass = `${buttonSmallBaseClass} ${primaryColorClass}`;
export const dangerButtonClass = buttonBaseClass;

// 40px variants of the Figma "button" (used by the Cars screen and its dialogs). Colors (except the danger fill
// below) stay on the PrimeVue severity (`severity="secondary" outlined`, `severity="danger"`, `severity="danger" outlined`),
// which already follows the theme; only the Figma size/shape is forced here. Outlined secondary border =
// Figma `button/outlined/secondary/border/color` (#9ca3af in the gray mode) -> surface-400.
export const primaryButtonMdClass = `${buttonMdBaseClass} ${primaryColorClass}`;
export const secondaryButtonMdClass = `${buttonMdBaseClass} border-surface-400! text-color!`;
// Danger fill = Figma `button/danger/background` #dc2626 (red 600; Aura's danger is red 500), hover one step
// darker. Uses the PrimeVue palette vars (`--p-red-*`, Aura #dc2626), not Tailwind v4's oklch red-600. Only the
// Cars delete dialog (ConfirmDeleteDialog list mode) uses it; the label keeps Aura's danger ink in both themes.
export const dangerButtonMdClass = `${buttonMdBaseClass} border-(--p-red-600)! bg-(--p-red-600)! text-(--p-button-danger-color)! hover:border-(--p-red-700)! hover:bg-(--p-red-700)!`;
