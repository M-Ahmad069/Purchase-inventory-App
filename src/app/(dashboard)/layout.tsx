import Link from "next/link";

import { DashboardNavMobile } from "@/components/dashboard-nav";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("icon_url")
    .eq("id", 1)
    .maybeSingle();
  const iconUrl = appSettings?.icon_url ?? null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link
            href="/items"
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm dark:bg-emerald-500">
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt={BRAND.name} className="h-full w-full object-cover" />
              ) : (
                BRAND.shortName
              )}
            </span>
            <span className="truncate text-base font-bold text-[var(--foreground)] sm:text-lg">
              {BRAND.name}
            </span>
          </Link>
          <DashboardHeaderActions iconUrl={iconUrl} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl animate-fade-in px-3 py-4 pb-24 sm:px-4 sm:py-5 md:pb-8">
        {children}
      </main>

      <DashboardNavMobile />
    </div>
  );
}
