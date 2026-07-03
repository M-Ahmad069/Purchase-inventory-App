import Link from "next/link";

import { DashboardNavMobile } from "@/components/dashboard-nav";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { BRAND } from "@/lib/brand";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link
            href="/items"
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm dark:bg-emerald-500">
              {BRAND.shortName}
            </span>
            <span className="truncate text-base font-bold text-[var(--foreground)] sm:text-lg">
              {BRAND.name}
            </span>
          </Link>
          <DashboardHeaderActions />
        </div>
      </header>

      <main className="mx-auto max-w-5xl animate-fade-in px-3 py-4 pb-24 sm:px-4 sm:py-5 md:pb-8">
        {children}
      </main>

      <DashboardNavMobile />
    </div>
  );
}
