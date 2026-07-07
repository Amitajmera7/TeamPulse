"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/config/navigation";

interface NavigationItemProps {
  item: NavItemConfig;
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
  const active = !item.disabled && isActive(pathname, item.href);
  const Icon = item.icon;

  const content = (
    <>
      {active && (
        <span
          className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors duration-200",
          active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
        )}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px]">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </>
  );

  const className = cn(
    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200",
    item.disabled
      ? "cursor-not-allowed text-sidebar-foreground/35"
      : active
        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm"
        : "font-medium text-sidebar-foreground/65 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    collapsed && "justify-center px-2"
  );

  if (item.disabled) {
    return (
      <span aria-disabled className={className}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}
