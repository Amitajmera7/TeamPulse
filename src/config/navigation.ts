import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

import type { NavItem } from "@/types/layout";

export const SIDEBAR_WIDTH = 280;

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
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
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  developers: "Developers",
  teams: "Teams",
  analytics: "Analytics",
  leaderboard: "Leaderboard",
  ai: "AI Insights",
  settings: "Settings",
};
