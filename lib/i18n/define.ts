// `vi` defines the message shape; `en` must provide exactly the same keys and
// signatures (TypeScript reports missing or extra keys). Values are strings or
// functions for interpolation, e.g. `(n: number) => \`${n} tasks\``.
export function defineMessages<T>(messages: { vi: T; en: NoInfer<T> }): { vi: T; en: T } {
  return messages;
}
