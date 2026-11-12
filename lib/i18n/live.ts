// A label map that always reads from the current language, for module-level
// constants used as `LABELS[key]` (and with Object.keys/entries).
export function liveLabels<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get: (_, key) => (get() as Record<PropertyKey, unknown>)[key],
    has: (_, key) => key in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_, key) => {
      const value = (get() as Record<PropertyKey, unknown>)[key];
      return value === undefined ? undefined : { enumerable: true, configurable: true, value };
    },
  });
}
