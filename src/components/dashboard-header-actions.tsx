"use client";

import { DashboardNavDesktop } from "@/components/dashboard-nav";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <DashboardNavDesktop />
      <ThemeToggle />
      <ProfileMenu />
    </div>
  );
}
