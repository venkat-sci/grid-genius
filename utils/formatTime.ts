// utils/formatTime.ts
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const msPart = ms % 1000;
  return `${seconds}.${msPart.toString().padStart(3, "0")}s`;
}
