// App-wide translation dictionary, composed from per-area message modules in
// ./messages. Each module's `vi` is the source of truth for its shape and `en`
// must mirror it (enforced by defineMessages). Access via useT() in components
// or tr() in non-React code.
import { getLang } from "./state";
import { core } from "./messages/core";
import { home } from "./messages/home";
import { ui } from "./messages/ui";

const modules = [core, home, ui] as const;

type Merge<M extends readonly { vi: object }[]> = M extends readonly [infer H extends { vi: object }, ...infer R extends readonly { vi: object }[]]
  ? H["vi"] & Merge<R>
  : unknown;

export type Dict = Merge<typeof modules>;

function merge(lang: "vi" | "en"): Dict {
  return Object.assign({}, ...modules.map((m) => m[lang])) as Dict;
}

export const dict: Record<"vi" | "en", Dict> = { vi: merge("vi"), en: merge("en") };

/** Dictionary for the current language, for code outside React components. */
export const tr = (): Dict => dict[getLang()];
