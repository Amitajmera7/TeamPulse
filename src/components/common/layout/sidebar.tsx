"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, X, Zap } from "lucide-react";
import Link from "next/link";

import { NavigationItem } from "@/components/common/layout/navigation-item";
import { QuickActions } from "@/components/common/layout/quick-actions";
import {
  NAV_GROUPS,
  NAV_ITEMS,
  SIDEBAR_WIDTH,
} from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  mobileOpen,
  collapsed,
  onMobileClose,
  onToggleCollapse,
}: SidebarProps) {
  const showLabels = !collapsed;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        style={{ width: collapsed ? 72 : SIDEBAR_WIDTH }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-out",
          "lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[60px] items-center justify-between border-b border-sidebar-border/80 px-4">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex min-w-0 items-center gap-3 overflow-hidden transition-opacity duration-200 hover:opacity-90"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Zap className="size-[18px]" aria-hidden />
            </span>
            {showLabels && (
              <div className="min-w-0">
                <span className="block truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                  TeamPulse
                </span>
                <span className="block truncate text-[11px] font-medium text-sidebar-foreground/50">
                  Engineering Intelligence
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close sidebar"
            onClick={onMobileClose}
            className="lg:hidden"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          {NAV_GROUPS.map((group) => {
            const groupItems = NAV_ITEMS.filter((item) =>
              group.items.includes(item.href)
            );

            if (groupItems.length === 0) {
              return null;
            }

            return (
              <div key={group.label} className="mb-5 last:mb-0">
                {showLabels && (
                  <p className="mb-2 px-2.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => (
                    <NavigationItem
                      key={item.label}
                      item={item}
                      collapsed={collapsed}
                      onNavigate={onMobileClose}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border/80 px-3 py-3">
          <QuickActions collapsed={collapsed} />
        </div>

        <div className="border-t border-sidebar-border/80 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border border-sidebar-border/80 bg-background p-3 shadow-sm transition-all duration-200 hover:border-sidebar-primary/25 hover:shadow-md",
              collapsed && "justify-center p-2"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              AA
            </span>
            {showLabels && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
                  Amit Ajmera
                </p>
                <p className="truncate text-[12px] text-sidebar-foreground/50">
                  Project Manager
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden border-t border-sidebar-border p-2.5 lg:block">
          <Button
            variant="ghost"
            size="sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className={cn(
              "w-full gap-2 text-sidebar-foreground/70 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

interface MobileMenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MobileMenuButton({ onClick, className }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Open navigation menu"
      onClick={onClick}
      className={cn("lg:hidden", className)}
    >
      <Menu className="size-4" />
    </Button>
  );
}
