import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: iconUrl } = await supabase.rpc("get_app_icon_url");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-6 flex flex-col items-center animate-fade-in">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-md dark:bg-emerald-500">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt={BRAND.name} className="h-full w-full object-cover" />
          ) : (
            BRAND.shortName
          )}
        </span>
        <h1 className="mt-3 text-xl font-bold text-[var(--foreground)]">{BRAND.name}</h1>
        <p className="text-sm text-[var(--muted)]">{BRAND.tagline}</p>
      </div>
      <div className="w-full max-w-md animate-slide-up">{children}</div>
    </div>
  );
}
