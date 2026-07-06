// efficiency.ts

export function calculateEfficiency(
  estimatedHours: number,
  actualHours: number
) {
  if (actualHours === 0) return 0;

  return Math.min(
    100,
    (estimatedHours / actualHours) * 100
  );
}