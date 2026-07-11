"use client";

import { useCallback, useEffect, useState } from "react";

import { OperationsActions } from "@/components/operations/operations-actions";
import {
  OperationsDetailStrip,
  OperationsHealthCards,
} from "@/components/operations/operations-health-cards";
import { OperationsRuntimeLogs } from "@/components/operations/operations-runtime-logs";
import { OperationsSyncTimeline } from "@/components/operations/operations-sync-timeline";
import { OperationsVerificationSummary } from "@/components/operations/operations-verification-summary";
import {
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type {
  AnalyticsSyncStep,
  LastSyncSummary,
  SyncState,
} from "@/services/orchestrator";

interface OperationsPayload {
  success: boolean;
  syncState: SyncState;
  lastSync: LastSyncSummary;
  pipelineSteps: AnalyticsSyncStep[];
}

const EMPTY_SYNC: SyncState = {
  status: "Idle",
  currentStep: "Idle",
  startedAt: null,
  completedAt: null,
  progressPercent: 0,
  errorMessage: null,
};

const EMPTY_LAST: LastSyncSummary = {
  success: false,
  syncStatus: "Idle",
  currentStep: "Idle",
  progressPercent: 0,
  startedAt: null,
  completedAt: null,
  durationMs: null,
  issuesProcessed: 0,
  worklogsProcessed: 0,
  eawBatchId: null,
  eawPersisted: false,
  snapshotPublished: false,
  validationStatus: "Not Run",
  warehouseStatus: "Unknown",
  analyticsStatus: "Unknown",
  errorMessage: null,
  logLines: [],
};

export function OperationsCenter() {
  const [syncState, setSyncState] = useState<SyncState>(EMPTY_SYNC);
  const [lastSync, setLastSync] = useState<LastSyncSummary>(EMPTY_LAST);
  const [steps, setSteps] = useState<AnalyticsSyncStep[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/operations", { cache: "no-store" });
    if (!response.ok) {
      setMessage(`Failed to load operations status (${response.status})`);
      return;
    }
    const payload = (await response.json()) as OperationsPayload;
    setSyncState(payload.syncState);
    setLastSync(payload.lastSync);
    setSteps(payload.pipelineSteps);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (syncState.status !== "Running") {
      return;
    }
    const id = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [syncState.status, refresh]);

  const runSync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        eawBatchId?: string | null;
      };
      if (!response.ok || payload.success === false) {
        setMessage(payload.error ?? `Sync failed (${response.status})`);
      } else {
        setMessage(
          payload.eawBatchId
            ? `Sync completed. EAW batch ${payload.eawBatchId}`
            : "Sync completed."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Sync request failed."
      );
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const isRunning = syncState.status === "Running" || busy;

  return (
    <div className={dashboardSectionSpacing}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={dashboardTypography.sectionTitle}>
            Operations & Sync Center
          </h1>
          <p className={dashboardTypography.sectionDescription}>
            Monitor TeamPulse sync health, warehouse persistence, and analytics
            publication
          </p>
        </div>
        {message ? (
          <p className="max-w-xl text-[13px] text-muted-foreground">{message}</p>
        ) : null}
      </div>

      <section>
        <div className="mb-4">
          <h2 className={dashboardTypography.sectionTitle}>System Health</h2>
          <p className={dashboardTypography.sectionDescription}>
            Live sync and last-run operational signals
          </p>
        </div>
        <OperationsHealthCards syncState={syncState} lastSync={lastSync} />
        <div className="mt-4">
          <OperationsDetailStrip lastSync={lastSync} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <OperationsSyncTimeline
            steps={steps}
            currentStep={syncState.currentStep}
            syncStatus={syncState.status}
            progressPercent={syncState.progressPercent}
          />
        </div>
        <div className="xl:col-span-4">
          <OperationsActions
            isRunning={isRunning}
            onRunSync={() => {
              void runSync();
            }}
            onRefresh={() => {
              void refresh();
            }}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OperationsVerificationSummary lastSync={lastSync} />
        <OperationsRuntimeLogs lines={lastSync.logLines} />
      </section>
    </div>
  );
}
