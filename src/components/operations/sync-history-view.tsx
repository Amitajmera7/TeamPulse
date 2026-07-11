"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SyncHistoryTable } from "@/components/operations/sync-history-table";
import {
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type {
  SyncHistoryEntry,
  SyncHistoryPagination,
  SyncHistorySource,
} from "@/services/operations-history";

interface HistoryPayload {
  success: boolean;
  entries: SyncHistoryEntry[];
  pagination: SyncHistoryPagination;
  source: SyncHistorySource;
  warehouseAvailable: boolean;
  error?: string;
}

const PAGE_SIZE = 25;

export function SyncHistoryView() {
  const [entries, setEntries] = useState<SyncHistoryEntry[]>([]);
  const [pagination, setPagination] = useState<SyncHistoryPagination | null>(
    null
  );
  const [source, setSource] = useState<SyncHistorySource>("memory");
  const [warehouseAvailable, setWarehouseAvailable] = useState(false);
  const [offset, setOffset] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/operations/history?limit=${PAGE_SIZE}&offset=${nextOffset}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as HistoryPayload;
      if (!response.ok || payload.success === false) {
        setMessage(payload.error ?? `Failed to load history (${response.status})`);
        return;
      }
      setEntries(payload.entries);
      setPagination(payload.pagination);
      setSource(payload.source);
      setWarehouseAvailable(payload.warehouseAvailable);
      setOffset(nextOffset);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load sync history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(0);
  }, [refresh]);

  return (
    <div className={dashboardSectionSpacing}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/operations">
                <ArrowLeft data-icon="inline-start" />
                Back to Operations
              </Link>
            </Button>
          </div>
          <h1 className={dashboardTypography.sectionTitle}>Sync History</h1>
          <p className={dashboardTypography.sectionDescription}>
            Operational history for TeamPulse sync runs
            {warehouseAvailable
              ? ` · source: ${source}`
              : " · warehouse unavailable (in-memory fallback)"}
          </p>
        </div>
        {message ? (
          <p className="max-w-xl text-[13px] text-muted-foreground">{message}</p>
        ) : null}
      </div>

      {loading && entries.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Loading history…</p>
      ) : (
        <SyncHistoryTable entries={entries} />
      )}

      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">
            Showing {entries.length} of {pagination.total}
            {pagination.offset > 0 ? ` · offset ${pagination.offset}` : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || offset <= 0}
              onClick={() => {
                void refresh(Math.max(0, offset - PAGE_SIZE));
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !pagination.hasMore}
              onClick={() => {
                void refresh(offset + PAGE_SIZE);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
