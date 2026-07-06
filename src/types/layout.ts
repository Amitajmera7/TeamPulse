import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface QuickActionItem {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  greeting?: string;
}

export interface SectionCardProps {
  label: string;
  description?: string;
  className?: string;
}

export interface SectionPlaceholderProps {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
}
