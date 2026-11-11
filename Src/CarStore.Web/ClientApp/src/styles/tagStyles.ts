// Figma "tag" (Prometheus node 2001:15; dashboard I2007:127;2007:97, Cars table/details 2076:3839):
// 11px / 500, 0.11px tracking, 2px 6px padding, 6px radius, 17px tall (the node's "normal" line height,
// measured as 13px in the frame). Colors stay on PrimeVue's `severity` tokens, so both themes follow.
export const tagPt = {
  root: { class: "self-start rounded-md! px-1.5! py-0.5! text-[11px]! font-medium! leading-[13px]! tracking-[0.11px]!" },
  label: { class: "leading-[13px]!" },
};
