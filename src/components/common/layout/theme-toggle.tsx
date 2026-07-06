"use client";

import { Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled
      aria-label="Toggle theme"
      title="Theme toggle coming soon"
      className={cn(className)}
    >
      <Sun className="size-4" aria-hidden />
    </Button>
  );
}
