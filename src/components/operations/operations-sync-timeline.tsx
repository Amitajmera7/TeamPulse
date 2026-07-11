"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { AnalyticsSyncStep } from "@/services/orchestrator";
import { cn } from "@/lib/utils";

interface OperationsSyncTimelineProps {
  steps: readonly AnalyticsSyncStep[];
  currentStep: AnalyticsSyncStep;
  syncStatus: string;
  progressPercent: number;
}

function stepState(
  step: AnalyticsSyncStep,
  steps: readonly AnalyticsSyncStep[],
  currentStep: AnalyticsSyncStep,
  syncStatus: string
): "done" | "active" | "pending" | "failed" {
  const currentIndex = steps.indexOf(
    currentStep === "Idle" ? steps[0] : currentStep
  );
  const stepIndex = steps.indexOf(step);

  if (syncStatus === "Failed" && stepIndex === currentIndex) {
    return "failed";
  }
  if (syncStatus === "Completed") {
    return "done";
  }
  if (syncStatus === "Running") {
    if (stepIndex < currentIndex) {
      return "done";
    }
    if (stepIndex === currentIndex) {
      return "active";
    }
    return "pending";
  }
  if (syncStatus === "Idle") {
    return "pending";
  }
  if (stepIndex < currentIndex) {
    return "done";
  }
  if (stepIndex === currentIndex) {
    return syncStatus === "Failed" ? "failed" : "active";
  }
  return "pending";
}

export function OperationsSyncTimeline({
  steps,
  currentStep,
  syncStatus,
  progressPercent,
}: OperationsSyncTimelineProps) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Sync Timeline
        </CardTitle>
        <p className={dashboardTypography.description}>
          Pipeline progress · {progressPercent}%
          {currentStep !== "Idle" ? ` · ${currentStep}` : ""}
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "space-y-2")}>
        <ol className="space-y-2">
          {steps.map((step) => {
            const state = stepState(step, steps, currentStep, syncStatus);
            return (
              <li
                key={step}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
              >
                {state === "done" && (
                  <CheckCircle2 className="size-4 text-primary" aria-hidden />
                )}
                {state === "active" && (
                  <Loader2
                    className="size-4 animate-spin text-primary"
                    aria-hidden
                  />
                )}
                {state === "failed" && (
                  <XCircle className="size-4 text-destructive" aria-hidden />
                )}
                {state === "pending" && (
                  <Circle className="size-4 text-muted-foreground" aria-hidden />
                )}
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    state === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
