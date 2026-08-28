// Brand constants — one source for brand asset paths and the chrome colours used
// *outside* CSS (PWA manifest, viewport theme colour). CSS uses the matching
// `--foreground` / `--background` tokens in `globals.css`; keep the two in sync.
export const BRAND = {
  name: "Mono",
  mark: "/brand/mono.svg", // MO/NO square mark shown at the top of each screen
  black: "#000000", // matches --foreground
  white: "#ffffff", // matches --background
} as const;
