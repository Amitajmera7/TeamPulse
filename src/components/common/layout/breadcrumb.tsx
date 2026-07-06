import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ROUTE_LABELS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types/layout";

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

function buildBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = ROUTE_LABELS[segment] ?? segment;

    return {
      label,
      href: index < segments.length - 1 ? href : undefined,
    };
  });
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const crumbs = items ?? [{ label: "TeamPulse" }];

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PathBreadcrumbProps {
  pathname: string;
  className?: string;
}

export function PathBreadcrumb({ pathname, className }: PathBreadcrumbProps) {
  return (
    <Breadcrumb
      items={buildBreadcrumbsFromPath(pathname)}
      className={className}
    />
  );
}
