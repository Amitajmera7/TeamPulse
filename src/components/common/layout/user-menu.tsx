"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  className?: string;
  userName?: string;
  userInitials?: string;
}

export function UserMenu({
  className,
  userName = "Amit Ajmera",
  userInitials = "AA",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-2 pl-1"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {userInitials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
          {userName}
        </span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-popover p-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="size-4" aria-hidden />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            onClick={() => setOpen(false)}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
