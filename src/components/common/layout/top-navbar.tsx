"use client";

import { usePathname } from "next/navigation";

import { PathBreadcrumb } from "@/components/common/layout/breadcrumb";
import { MobileMenuButton } from "@/components/common/layout/sidebar";
import { MonthSelector } from "@/components/common/layout/month-selector";
import { NotificationButton } from "@/components/common/layout/notification-button";
import { SearchBar } from "@/components/common/layout/search-bar";
import { TechnologyFilter } from "@/components/common/layout/technology-filter";
import { ThemeToggle } from "@/components/common/layout/theme-toggle";
import { UserMenu } from "@/components/common/layout/user-menu";
import { ROUTE_LABELS } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  onMobileMenuOpen: () => void;
  className?: string;
}

function getCurrentPageTitle(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  return ROUTE_LABELS[segment] ?? "Dashboard";
}

export function TopNavbar({ onMobileMenuOpen, className }: TopNavbarProps) {
  const pathname = usePathname();
  const pageTitle = getCurrentPageTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileMenuButton onClick={onMobileMenuOpen} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground lg:hidden">
            {pageTitle}
          </h2>
          <PathBreadcrumb pathname={pathname} className="hidden lg:flex" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SearchBar />
        <div className="hidden items-center gap-2 md:flex">
          <TechnologyFilter />
          <MonthSelector />
        </div>
        <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
          <NotificationButton />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
