export function formatDuration(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
