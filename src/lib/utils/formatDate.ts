export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysSince(iso: string | null | undefined): number {
  if (!iso) return Infinity;
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return Infinity;
  return Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
}
