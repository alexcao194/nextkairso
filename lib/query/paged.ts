import type { Paged } from "../api/schema";

export async function fetchAll<T>(
  fn: (q: { page: number; limit: number }) => Promise<Paged<T>>,
  limit = 100,
  maxPages = 50,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fn({ page, limit });
    out.push(...(res?.items ?? []));
    if (!res?.hasMore) break;
  }
  return out;
}

