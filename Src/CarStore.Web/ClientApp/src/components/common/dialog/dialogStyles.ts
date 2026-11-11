// Shared PrimeVue Dialog `pt` shell + footer button classes, matching the Figma modal spec
// (rounded-[21px] white panel, 67px header, 3-gap footer). Only the width and content
// padding vary between dialogs (form dialogs use wider gaps than read-only "Details" dialogs),
// so callers pass those in.
import { primaryButtonClass, secondaryButtonClass, dangerButtonClass } from "../../../styles/buttonStyles";

const FORM_CONTENT_CLASS = "flex flex-col gap-[21px] px-6 py-2";
const DETAILS_CONTENT_CLASS = "flex flex-col gap-1.75 px-[21px] py-[17.5px]";

export function dialogShellPt(width: string, contentClass: string = FORM_CONTENT_CLASS) {
  return {
    root: { class: `${width} max-w-[92vw] rounded-[21px] border border-surface-300 bg-surface-0 p-0 overflow-hidden` },
    header: { class: "h-[67px] items-center justify-between pt-5 pb-4 pl-6 pr-4" },
    content: { class: contentClass },
    footer: { class: "gap-3 justify-end pb-5 pt-4 px-6" },
  };
}

export function detailsDialogPt(width: string) {
  return dialogShellPt(width, DETAILS_CONTENT_CLASS);
}

// Figma "dialog" (Prometheus, Cars frames 2072:2729 / 2074:3769 / 2075:4909): 12px radius, 1px
// `content/border/color` border (surface-200), overlay/modal shadow (Tailwind shadow-xl), 18px header
// padding with a 32px icon-only close button (6px radius), content and footer inset 18px with no top
// padding, 16px content gap, 6px footer gap. Render the close glyph with the Dialog `#closeicon` slot
// (Lucide `X`). Width is the caller's (`w-[400px]` in the frames), so 400 - 2 x 1px border - 2 x 18px = 362px content.
// PrimeVue's dialog CSS is injected outside Tailwind's layers, so every padding/gap utility that must beat
// `.p-dialog-header/-content/-footer { padding: dt(...) }` and the footer `gap` needs the `!` suffix.
export function modalDialogPt(width: string, contentClass = "flex flex-col gap-4") {
  return {
    root: { class: `${width} max-w-[92vw] rounded-xl border border-surface-200 bg-surface-0 p-0 shadow-xl overflow-hidden` },
    header: { class: "items-center gap-2 p-[18px]!" },
    pcCloseButton: { root: { class: "icon-motion size-8! rounded-md! text-color! [&_.lucide]:size-4!" } },
    content: { class: `${contentClass} px-[18px]! pb-[18px]! pt-0!` },
    footer: { class: "gap-1.5! justify-end px-[18px]! pb-[18px]! pt-0!" },
  };
}

// Figma `heading/sm` dialog title: 18px / 24px, 600.
export const modalDialogTitleClass = "min-w-0 flex-1 text-lg leading-6 font-semibold text-color";

// Figma "inputtext" / "select" / "textarea" inside the form dialog (2075:4921, 2075:4944, 2075:5025):
// 40px tall = 1px border + 8.5px padding + 21px line, 14px text, 16px side padding inside the border.
// Border = Figma input border #9ca3af -> surface-400 (forced here: Aura's default is surface-300); it is skipped
// while focused (`.p-select` uses the `p-focus` class) so PrimeVue's focus ring color still shows. In dark theme
// surface-400 follows the inverted ramp, so the border stays visible. Other colors stay on the PrimeVue tokens.
// `!` beats PrimeVue's `.p-inputtext` / `.p-select` / `.p-select-label` rules (injected outside Tailwind's layers).
const modalBorderClass = "not-focus:border-surface-400!";
export const modalInputClass = `h-10! px-4! py-0! text-sm! leading-[21px]! ${modalBorderClass}`;
export const modalInputNumberPt = { pcInputText: { root: { class: modalInputClass } } };
export const modalSelectPt = {
  root: { class: "h-10 not-[.p-focus]:border-surface-400!" },
  // `.p-select-label { display: block }` ignores flex centering, so a 38px line (40px - 2 x 1px border)
  // centers the 14px text vertically and keeps the ellipsis working.
  label: { class: "px-4! py-0! text-sm! leading-[38px]!" },
  // Figma chevron-down (2075:5083 / 2075:4944): `icon/size` 14px, `select/dropdown/color` #6b7280 -> muted
  // (Aura draws 16px in surface-400). The glyph itself is Lucide ChevronDown via the `#dropdownicon` slot
  // (`modalSelectChevronProps`): PrimeVue's own chevron fills 12x6.8px of the box, Figma's ~8x4.5px.
  dropdownIcon: { class: "size-3.5! text-muted-color!" },
};
export const modalSelectChevronProps = {
  size: 14,
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  class: "size-3.5 text-muted-color",
};
// Textarea: 5 lines of 21px + 2 x 8.5px padding + 2px border = 124px (Figma 2075:5025).
export const modalTextareaClass = `h-[124px] resize-none px-4! py-[8.5px]! text-sm! leading-[21px]! ${modalBorderClass}`;

export const dialogSecondaryButtonClass = secondaryButtonClass;
export const dialogPrimaryButtonClass = primaryButtonClass;
export const dialogDangerButtonClass = dangerButtonClass;
