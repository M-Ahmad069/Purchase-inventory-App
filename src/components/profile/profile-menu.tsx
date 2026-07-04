"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { buttonSecondaryClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

type ProfileUser = {
  email: string;
  displayName: string;
};

function getInitials(email: string, displayName: string) {
  const source = displayName.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function getDisplayLabel(email: string, displayName: string) {
  return displayName.trim() || email;
}

export function ProfileMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser({
        email: authUser.email ?? "",
        displayName: String(authUser.user_metadata?.display_name ?? ""),
      });
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;
      if (!authUser) {
        setUser(null);
        return;
      }

      setUser({
        email: authUser.email ?? "",
        displayName: String(authUser.user_metadata?.display_name ?? ""),
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setOpen(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (loadingUser) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--card)]"
        aria-hidden
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600 dark:border-gray-600 dark:border-t-emerald-400" />
      </div>
    );
  }

  if (!user) return null;

  const label = getDisplayLabel(user.email, user.displayName);
  const initials = getInitials(user.email, user.displayName);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className={`${buttonSecondaryClassName} flex !min-h-10 items-center gap-2 !px-2 !py-2 sm:!px-3`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500">
          {initials}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:inline">
          {label}
        </span>
        <svg
          className={`hidden h-4 w-4 shrink-0 text-[var(--muted)] transition-transform sm:block ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--input-border)] bg-[var(--card)] py-1 shadow-xl dark:shadow-black/40"
        >
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {label}
            </p>
            {user.displayName.trim() && (
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {user.email}
              </p>
            )}
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2 px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80"
          >
            <svg
              className="h-4 w-4 text-[var(--muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            {signingOut ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600 dark:border-red-800 dark:border-t-red-400" />
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
