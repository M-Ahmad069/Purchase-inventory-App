"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/items", label: "Items", shortLabel: "Items" },
  { href: "/purchases/new", label: "Log Purchase", shortLabel: "Log" },
  { href: "/purchases", label: "History", shortLabel: "History" },
];

function isActive(pathname: string, href: string) {
  if (href === "/purchases/new") return pathname === "/purchases/new";
  if (href === "/purchases") return pathname === "/purchases";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSpinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
      aria-hidden
    />
  );
}

export function DashboardNavDesktop() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isNavigating = pendingHref !== null;

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        const pending = pendingHref === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-disabled={isNavigating && !pending ? true : undefined}
            onClick={() => {
              if (item.href !== pathname) setPendingHref(item.href);
            }}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            } ${isNavigating && !pending ? "pointer-events-none opacity-50" : ""} ${
              pending ? "opacity-80" : ""
            }`}
          >
            <span className="flex items-center gap-1.5">
              {pending && <NavSpinner />}
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardNavMobile() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isNavigating = pendingHref !== null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md safe-bottom touch-manipulation md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const pending = pendingHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-disabled={isNavigating && !pending ? true : undefined}
              onClick={() => {
                if (item.href !== pathname) setPendingHref(item.href);
              }}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-center transition-all active:scale-95 ${
                active
                  ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500"
                  : "text-gray-600 dark:text-gray-300"
              } ${isNavigating && !pending ? "pointer-events-none opacity-50" : ""} ${
                pending ? "opacity-80" : ""
              }`}
            >
              {pending ? (
                <NavSpinner />
              ) : (
                <span className="text-xs font-bold leading-tight">
                  {item.shortLabel}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
