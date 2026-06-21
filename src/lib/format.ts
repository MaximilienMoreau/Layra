export function truncateName(name: string, max = 28): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  if (dot > 0) {
    const ext = name.slice(dot);
    return name.slice(0, dot).slice(0, max - ext.length - 1) + "…" + ext;
  }
  return name.slice(0, max - 1) + "…";
}
