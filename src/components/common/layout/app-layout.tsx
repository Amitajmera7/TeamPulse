"use client";

import { useEffect, useState } from "react";

import { GlobalFilterBar } from "@/components/common/layout/global-filter-bar";
import { Sidebar } from "@/components/common/layout/sidebar";
import { TopNavbar } from "@/components/common/layout/top-navbar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background")}>
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />
        <GlobalFilterBar />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
