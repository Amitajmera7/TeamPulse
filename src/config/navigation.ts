import {
  Activity,
  BarChart3,
  Bot,
  LayoutDashboard,
  Link2,
  Settings,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

import type { NavItem } from "@/types/layout";

export const SIDEBAR_WIDTH = 280;

export interface NavItemConfig extends NavItem {
  badge?: string;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Operations",
    href: "/operations",
    icon: Activity,
  },
  {
    label: "Developers",
    href: "/developers",
    icon: Users,
  },
  {
    label: "Teams",
    href: "/teams",
    icon: UsersRound,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    label: "AI Insights",
    href: "/ai",
    icon: Bot,
    badge: "Beta",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Integrations",
    href: "#",
    icon: Link2,
    disabled: true,
  },
];

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  operations: "Operations",
  developers: "Developers",
  teams: "Teams",
  analytics: "Analytics",
  leaderboard: "Leaderboard",
  ai: "AI Insights",
  settings: "Settings",
};

export interface NavGroup {
  label: string;
  items: NavItem["href"][];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: ["/dashboard", "/operations"],
  },
  {
    label: "Analytics",
    items: ["/developers", "/teams", "/analytics", "/leaderboard"],
  },
  {
    label: "Intelligence",
    items: ["/ai"],
  },
  {
    label: "Workspace",
    items: ["/settings", "#"],
  },
];
