/** Numeric segment-wise comparator for APQC hierarchy IDs like "10.1.1" vs "2.1.1" — a
 * plain string sort would (wrongly) put "10.1.1" before "2.1.1". */
export function compareHierarchyIds(a: string, b: string): number {
  const as = a.split(".").map(Number);
  const bs = b.split(".").map(Number);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
