"use client";

import { useCallback, useEffect, useState } from "react";

import { MOCK_ALLOCATION_READ_MODEL } from "@/services/allocation";
import type { AllocationReadModel } from "@/types/allocation";

export type AllocationStatus = "loading" | "ready" | "empty" | "error";

export interface UseAllocationModelResult {
  status: AllocationStatus;
  model: AllocationReadModel | null;
  error: string | null;
  retry: () => void;
}

const SIMULATED_LOAD_MS = 500;

/**
 * The single seam between the Allocation UI and its data.
 *
 * Sprint 2 resolves a mock `AllocationReadModel` after a short delay so the
 * loading, ready and empty paths all run. Sprint 3 replaces only the body of
 * the effect with `fetch("/api/allocation")` and sets `error` on failure —
 * no component below this hook changes, because every one of them already
 * consumes the read model and nothing else.
 */
export function useAllocationModel(): UseAllocationModelResult {
  const [status, setStatus] = useState<AllocationStatus>("loading");
  const [model, setModel] = useState<AllocationReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Resetting here rather than in the effect body keeps the state transition
  // in the event that caused it.
  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      const next = MOCK_ALLOCATION_READ_MODEL;
      setModel(next);
      setStatus(next.developers.length === 0 ? "empty" : "ready");
    }, SIMULATED_LOAD_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attempt]);

  return { status, model, error, retry };
}
