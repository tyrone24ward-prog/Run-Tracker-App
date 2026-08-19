export function metFromSpeedMps(mps: number): number {
  const mph = mps * 2.23693629;
  if (mph < 0.5) return 1.8;
  if (mph < 2.0) return 2.8;
  if (mph < 3.0) return 3.5;
  if (mph < 4.0) return 4.8;
  if (mph < 5.0) return 8.3;
  if (mph < 6.0) return 9.8;
  if (mph < 7.0) return 11.0;
  if (mph < 8.0) return 11.8;
  if (mph < 9.0) return 12.8;
  if (mph < 10.0) return 14.5;
  return 16.0;
}

export function caloriesForInterval(
  weightKg: number,
  speedMps: number,
  durationMs: number,
): number {
  const hours = durationMs / 3_600_000;
  if (hours <= 0 || weightKg <= 0) return 0;
  return metFromSpeedMps(speedMps) * weightKg * hours;
}
