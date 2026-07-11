"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ExplorerDevelopersTable } from "@/components/explorer/explorer-developers-table";
import { ExplorerOverviewCards } from "@/components/explorer/explorer-overview-cards";
import { ExplorerProjectsTable } from "@/components/explorer/explorer-projects-table";
import { ExplorerSearchPanel } from "@/components/explorer/explorer-search-panel";
import { ExplorerTechnologyCards } from "@/components/explorer/explorer-technology-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerReadModel } from "@/services/analytics-read/explorer";

const EMPTY: ExplorerReadModel = {
  reportingPeriod: { month: "—", from: "", to: "" },
  generatedAt: null,
  syncStatus: "Idle",
  overview: {
    developers: 0,
    technologies: 0,
    projects: 0,
    engineeringValueDeliveredHours: 0,
    recoveryHours: 0,
    engineeringScore: null,
    deliveryEfficiency: null,
  },
  developers: [],
  technologies: [],
  projects: [],
  searchIndex: [],
  meta: {
    snapshotAvailable: false,
    warehouseAvailable: false,
    limitations: [],
  },
};

const TAB_VALUES = [
  "overview",
  "developers",
  "technologies",
  "projects",
  "search",
] as const;

type TabValue = (typeof TAB_VALUES)[number];

function resolveTab(value: string | null): TabValue {
  if (value && (TAB_VALUES as readonly string[]).includes(value)) {
    return value as TabValue;
  }
  return "overview";
}

export function ExplorerCenter() {
  const searchParams = useSearchParams();
  const [model, setModel] = useState<ExplorerReadModel>(EMPTY);
  const [tab, setTab] = useState<TabValue>(() =>
    resolveTab(searchParams.get("tab"))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTab(resolveTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/explorer", { cache: "no-store" });
        const payload = (await response.json()) as ExplorerReadModel & {
          success?: boolean;
          error?: string;
        };
        if (!response.ok || payload.success === false) {
          if (!cancelled) {
            setMessage(payload.error ?? `Failed to load (${response.status})`);
          }
          return;
        }
        if (!cancelled) {
          setModel(payload);
          setMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error ? error.message : "Failed to load explorer."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={dashboardSectionSpacing}>
      <div>
        <h1 className={dashboardTypography.sectionTitle}>
          Engineering Explorer
        </h1>
        <p className={dashboardTypography.sectionDescription}>
          Drill into developers, technologies, and projects from Analytics
          Snapshot outputs
          {model.generatedAt
            ? ` · snapshot ${new Date(model.generatedAt).toLocaleString()}`
            : ""}
        </p>
        {message ? (
          <p className="mt-2 text-[13px] text-muted-foreground">{message}</p>
        ) : null}
        {loading ? (
          <p className="mt-2 text-[13px] text-muted-foreground">Loading…</p>
        ) : null}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(resolveTab(value))}
        className="gap-4"
      >
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="technologies">Technologies</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ExplorerOverviewCards overview={model.overview} />
          {model.meta.limitations[0] ? (
            <p className="text-[12px] text-muted-foreground">
              {model.meta.limitations[0]}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="developers">
          <ExplorerDevelopersTable developers={model.developers} />
        </TabsContent>

        <TabsContent value="technologies">
          <ExplorerTechnologyCards technologies={model.technologies} />
        </TabsContent>

        <TabsContent value="projects">
          <ExplorerProjectsTable projects={model.projects} />
        </TabsContent>

        <TabsContent value="search">
          <ExplorerSearchPanel index={model.searchIndex} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
