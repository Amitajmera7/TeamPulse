import type { AllocationLoadStatus } from "@/types/allocation";

/**
 * Colour resolution for Allocation. Nothing here maps a specific project key
 * or status name — an unknown Jira instance gets a stable colour anyway.
 */

const PROJECT_PALETTE = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
];

/** Deterministic per-key colour so a project looks the same on every render. */
export function projectColor(key: string): string {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 9973;
  }
  return PROJECT_PALETTE[hash % PROJECT_PALETTE.length];
}

export function paletteColorAt(index: number): string {
  return PROJECT_PALETTE[index % PROJECT_PALETTE.length];
}

export const LOAD_STATUS_COLOR: Record<AllocationLoadStatus, string> = {
  available: "var(--chart-1)",
  light: "var(--chart-3)",
  busy: "var(--chart-4)",
  overloaded: "var(--destructive)",
};
