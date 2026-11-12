import type { CSSProperties } from "react";

export type Hue = "blue" | "violet" | "pink" | "rose" | "orange" | "amber" | "green" | "teal" | "cyan";

export const hueVars = (h: Hue): CSSProperties =>
  ({ "--h": `var(--${h})`, "--hs": `var(--${h}-soft)`, "--hl": `var(--${h}-line)`, "--hv": `var(--${h}-vivid)` }) as CSSProperties;

export const NAV_HUE = {
  home: "violet",
  inbox: "rose",
  myTasks: "blue",
  threads: "cyan",
  calendar: "orange",
  initiatives: "amber",
  analytics: "pink",
  files: "blue",
  quotes: "teal",
  settings: "green",
} as const satisfies Record<string, Hue>;
