/**
 * Runtime Verification — shared types and helpers.
 *
 * Sprint 6A Milestone 15 — verification/reporting only.
 * Does not change analytics formulas or runtime sync behavior.
 */

export type VerificationStatus = "PASS" | "FAIL";

export interface VerificationCheck {
  /** Short label shown in the report. */
  readonly label: string;
  /** Observed value (count or token). */
  readonly actual: string;
  /** Expected value when comparing layers; null for informational lines. */
  readonly expected: string | null;
  readonly passed: boolean;
  readonly detail?: string;
}

export interface VerificationSection {
  readonly name: string;
  readonly checks: readonly VerificationCheck[];
  /** Section passes when every check.passed is true. */
  readonly passed: boolean;
}

export interface VerificationReport {
  readonly status: VerificationStatus;
  readonly sections: readonly VerificationSection[];
  /** Human-readable multi-line report. */
  readonly summary: string;
  readonly generatedAt: string;
}

export function sectionFromChecks(
  name: string,
  checks: readonly VerificationCheck[]
): VerificationSection {
  return {
    name,
    checks,
    passed: checks.every((check) => check.passed),
  };
}

export function countCheck(
  label: string,
  actual: number,
  expected: number | null,
  detail?: string
): VerificationCheck {
  const passed = expected == null ? true : actual === expected;
  return {
    label,
    actual: String(actual),
    expected: expected == null ? null : String(expected),
    passed,
    detail,
  };
}

export function flagCheck(
  label: string,
  passed: boolean,
  actual: string,
  expected: string | null = null,
  detail?: string
): VerificationCheck {
  return { label, actual, expected, passed, detail };
}

export function nearlyEqual(
  a: number,
  b: number,
  epsilon = 1e-6
): boolean {
  return Math.abs(a - b) <= epsilon;
}
