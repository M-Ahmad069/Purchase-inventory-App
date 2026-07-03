"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buttonSecondaryClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLoading(false);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label={loading ? "Signing out…" : "Sign out"}
      className={`${buttonSecondaryClassName} !min-h-10 !min-w-10 !px-3 !py-2`}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600 dark:border-gray-600 dark:border-t-emerald-400" />
      ) : (
        <>
          <span className="hidden sm:inline">Sign out</span>
          <svg
            className="h-4 w-4 sm:hidden"
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
        </>
      )}
    </button>
  );
}
