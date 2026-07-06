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
  { label: "Export", icon: Download },
  { label: "Share", icon: Share2 },
] as const;

export function QuickActions({ collapsed = false, className }: QuickActionsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {!collapsed && (
        <p className="px-3 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase">
          Quick Actions
        </p>
      )}
      <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
        {ACTIONS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            variant="ghost"
            size={collapsed ? "icon-sm" : "sm"}
            disabled
            aria-label={label}
            title={label}
            className={cn(
              "w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "size-8 w-8 justify-center px-0"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span>{label}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}
