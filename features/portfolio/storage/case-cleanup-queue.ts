export type PendingCaseCleanup = { originalPath: string; reviewedPath: string };

const STORAGE_KEY = "portfolio:pending-case-storage-cleanup:v1";
const keyOf = ({ originalPath, reviewedPath }: PendingCaseCleanup) => `${originalPath}\u0000${reviewedPath}`;

export function readPendingCaseCleanup(): PendingCaseCleanup[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingCaseCleanup => Boolean(
      item && typeof item === "object"
      && typeof (item as PendingCaseCleanup).originalPath === "string"
      && typeof (item as PendingCaseCleanup).reviewedPath === "string",
    ));
  } catch {
    return [];
  }
}

export function enqueuePendingCaseCleanup(files: PendingCaseCleanup[]): PendingCaseCleanup[] {
  const merged = new Map(readPendingCaseCleanup().map((file) => [keyOf(file), file]));
  for (const file of files) merged.set(keyOf(file), file);
  const pending = [...merged.values()];
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  return pending;
}

export function resolvePendingCaseCleanup(files: PendingCaseCleanup[]): PendingCaseCleanup[] {
  const resolved = new Set(files.map(keyOf));
  const pending = readPendingCaseCleanup().filter((file) => !resolved.has(keyOf(file)));
  if (typeof localStorage !== "undefined") {
    if (pending.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    else localStorage.removeItem(STORAGE_KEY);
  }
  return pending;
}
