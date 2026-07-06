"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, X, Zap } from "lucide-react";
import Link from "next/link";

import { NavigationItem } from "@/components/common/layout/navigation-item";
import { QuickActions } from "@/components/common/layout/quick-actions";
import { NAV_ITEMS, SIDEBAR_WIDTH } from "@/config/navigation";
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
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Zap className="size-4" aria-hidden />
            </span>
            {showLabels && (
              <span className="truncate text-base font-semibold text-sidebar-foreground">
                TeamPulse
              </span>
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
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {NAV_ITEMS.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4">
          <QuickActions collapsed={collapsed} />
        </div>

        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <Button
            variant="ghost"
            size="sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className={cn(
              "w-full gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden />
                <span>Collapse</span>
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
