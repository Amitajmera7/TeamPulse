import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationButtonProps {
  className?: string;
}

export function NotificationButton({ className }: NotificationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled
      aria-label="Notifications"
      className={cn("relative", className)}
    >
      <Bell className="size-4" aria-hidden />
      <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
    </Button>
  );
}
