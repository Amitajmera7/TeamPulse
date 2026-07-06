"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/layout";

interface NavigationItemProps {
  item: NavItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationItem({
  item,
  collapsed = false,
  onNavigate,
}: NavigationItemProps) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
        )}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
