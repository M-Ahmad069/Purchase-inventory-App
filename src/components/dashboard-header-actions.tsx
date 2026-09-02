"use client";

import { DashboardNavDesktop } from "@/components/dashboard-nav";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

type DashboardHeaderActionsProps = {
  iconUrl?: string | null;
};

export function DashboardHeaderActions({ iconUrl = null }: DashboardHeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <DashboardNavDesktop />
      <ThemeToggle />
      <ProfileMenu iconUrl={iconUrl} />
    </div>
  );
}
