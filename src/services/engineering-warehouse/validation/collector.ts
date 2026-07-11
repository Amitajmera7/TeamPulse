/**
 * Mutable collector for validation findings.
 */

import type { ValidationCollector, ValidationFinding } from "./types";

export type { ValidationCollector };

export function createValidationCollector(): ValidationCollector {
  const items: ValidationFinding[] = [];

  return {
    error(code, entity, message, path) {
      items.push({
        severity: "error",
        code,
        entity,
        message,
        path,
      });
    },
    warning(code, entity, message, path) {
      items.push({
        severity: "warning",
        code,
        entity,
        message,
        path,
      });
    },
    findings() {
      return items;
    },
  };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseTimestamp(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function formatValidationSummary(input: {
  status: "PASS" | "FAIL";
  issues: number;
  worklogs: number;
  allocations: number;
  errorCount: number;
  warningCount: number;
}): string {
  return [
    "Validation Summary",
    "",
    input.status,
    "",
    "Issues",
    "",
    String(input.issues),
    "",
    "Worklogs",
    "",
    String(input.worklogs),
    "",
    "Allocations",
    "",
    String(input.allocations),
    "",
    "Errors",
    "",
    String(input.errorCount),
    "",
    "Warnings",
    "",
    String(input.warningCount),
  ].join("\n");
}
