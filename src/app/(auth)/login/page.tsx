"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  buttonClassName,
  cardClassName,
  fieldsetClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/items");
    router.refresh();
  }

  return (
    <div className={cardClassName}>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Sign in</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Access your shop records</p>

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset disabled={loading} className={`${fieldsetClassName} space-y-4`}>
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClassName}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </div>

          {error && (
            <p
              className="animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${buttonClassName} w-full`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
