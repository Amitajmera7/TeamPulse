"use client";

import { Bell, Search, Sun } from "lucide-react";

import { MonthSelector } from "@/components/common/layout/month-selector";
import { TechnologyFilter } from "@/components/common/layout/technology-filter";
import { UserMenu } from "@/components/common/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/greeting";
import { dashboardTypography } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

interface DashboardTopBarProps {
  className?: string;
}

export function DashboardTopBar({ className }: DashboardTopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur-md lg:px-8",
        className
      )}
    >
      <p className={cn("hidden shrink-0 md:block", dashboardTypography.description)}>
        {getGreeting()}
      </p>

      <div className="relative min-w-0 flex-1 lg:mx-auto lg:max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search developers, teams, tickets..."
          disabled
          aria-label="Search"
          className="h-10 w-full rounded-xl border border-border/70 bg-muted/25 py-2 pr-4 pl-10 text-[13px] shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary/30 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:outline-none"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <TechnologyFilter />
          <MonthSelector />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label="Toggle theme"
          className="rounded-lg transition-all duration-200 hover:bg-muted/60"
        >
          <Sun className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label="Notifications"
          className="relative rounded-lg transition-all duration-200 hover:bg-muted/60"
        >
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            3
          </span>
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
