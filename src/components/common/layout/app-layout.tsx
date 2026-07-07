"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { GlobalFilterBar } from "@/components/common/layout/global-filter-bar";
import { Sidebar, MobileMenuButton } from "@/components/common/layout/sidebar";
import { TopNavbar } from "@/components/common/layout/top-navbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!isDashboard && (
          <>
            <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />
            <GlobalFilterBar />
          </>
        )}

        {isDashboard && (
          <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <span className="ml-2 text-sm font-semibold">Dashboard</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
