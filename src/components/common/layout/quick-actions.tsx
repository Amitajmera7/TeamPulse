"use client";

import { Download, RefreshCw, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  collapsed?: boolean;
  className?: string;
}

const ACTIONS = [
  { label: "Sync Data", icon: RefreshCw },
  { label: "Export Report", icon: Download },
  { label: "Share Dashboard", icon: Share2 },
] as const;

export function QuickActions({ collapsed = false, className }: QuickActionsProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {!collapsed && (
        <p className="px-2.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
          Quick Actions
        </p>
      )}
      <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
        {ACTIONS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            variant="outline"
            size={collapsed ? "icon-sm" : "sm"}
            disabled
            aria-label={label}
            title={label}
            className={cn(
              "w-full justify-start gap-2 border-sidebar-border bg-background text-sidebar-foreground/80 shadow-none transition-all duration-200 hover:border-sidebar-primary/30 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "size-8 w-8 justify-center px-0"
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {!collapsed && <span className="text-xs">{label}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}
