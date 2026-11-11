// Shared action-button classes (Figma contrast primary action + neutral secondary/outlined),
// reused by dialog footers, page header "New X" buttons, and the Home page CTAs.
const buttonBaseClass = "gap-1.75! rounded-md! px-[11.5px]! py-2! text-sm! font-medium!";
// Figma "button-small" (dashboard node 2009:385): 32px tall, 12px label, 13px side padding.
const buttonSmallBaseClass = "h-8! gap-2! rounded-md! px-[13px]! py-0! text-xs! font-medium!";

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
