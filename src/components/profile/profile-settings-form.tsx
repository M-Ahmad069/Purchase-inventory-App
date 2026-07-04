"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  FormMessage,
  cardClassName,
  fieldsetClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { formatAppError, isValidEmail } from "@/lib/errors";

type ProfileSettingsFormProps = {
  email: string;
  displayName: string;
};

const actionButtonClassName =
  "min-h-10 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClassName}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "At least 8 characters.";
  }
  return null;
}

function isTestEmail(value: string) {
  return /^(test|example|demo)@/i.test(value);
}

export function ProfileSettingsForm({
  email,
  displayName: initialDisplayName,
}: ProfileSettingsFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameMessage, setNameMessage] = useState<{
    error?: string;
    success?: string;
  }>({});
  const [nameLoading, setNameLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<{
    error?: string;
    success?: string;
  }>({});
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    error?: string;
    success?: string;
  }>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function handleDisplayNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameLoading) return;

    setNameMessage({});
    setNameLoading(true);

    const supabase = createClient();
    const trimmedName = displayName.trim();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmedName || null },
    });

    if (error) {
      setNameMessage({
        error: formatAppError(error, "Could not save."),
      });
      setNameLoading(false);
      return;
    }

    setNameMessage({ success: "Saved." });
    setNameLoading(false);
    router.refresh();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailLoading) return;

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setEmailMessage({ error: "Enter a new email." });
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailMessage({ error: "Invalid email." });
      return;
    }

    if (trimmedEmail.toLowerCase() === email.toLowerCase()) {
      setEmailMessage({ error: "Use a different email." });
      return;
    }

    if (!emailPassword) {
      setEmailMessage({ error: "Enter your password." });
      return;
    }

    setEmailMessage({});
    setEmailLoading(true);

    const supabase = createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    const loginEmail = sessionUser?.email ?? email;

    if (sessionUser?.new_email) {
      setEmailMessage({
        error: `Confirm ${sessionUser.new_email} first.`,
      });
      setEmailLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;

    async function updateEmail() {
      return supabase.auth.updateUser(
        { email: trimmedEmail },
        { emailRedirectTo: redirectTo }
      );
    }

    let { error } = await updateEmail();

    if (
      error &&
      (error.code === "reauthentication_needed" ||
        error.message?.toLowerCase().includes("reauthenticate") ||
        error.message?.toLowerCase().includes("recent authentication"))
    ) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: emailPassword,
      });

      if (reauthError) {
        setEmailMessage({
          error: formatAppError(reauthError, "Wrong password."),
        });
        setEmailLoading(false);
        return;
      }

      ({ error } = await updateEmail());
    }

    if (error) {
      setEmailMessage({
        error: formatAppError(error, "Could not update email."),
      });
      setEmailLoading(false);
      return;
    }

    setEmailPassword("");
    setEmailMessage({ success: "Check your inbox to confirm." });
    setEmailLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordLoading) return;

    if (!currentPassword) {
      setPasswordMessage({ error: "Enter current password." });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setPasswordMessage({ error: passwordError });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ error: "Passwords do not match." });
      return;
    }

    setPasswordMessage({});
    setPasswordLoading(true);

    const supabase = createClient();

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      setPasswordMessage({
        error: formatAppError(reauthError, "Wrong password."),
      });
      setPasswordLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordMessage({
        error: formatAppError(updateError, "Could not update password."),
      });
      setPasswordLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({ success: "Password updated." });
    setPasswordLoading(false);
  }

  return (
    <div className="space-y-3">
      <Section title="Name">
        <form onSubmit={handleDisplayNameSubmit}>
          <fieldset disabled={nameLoading} className={`${fieldsetClassName} space-y-3`}>
            <div>
              <label htmlFor="profile-display-name" className={labelClassName}>
                Display name
              </label>
              <input
                id="profile-display-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClassName}
                placeholder="Your name"
              />
            </div>

            <FormMessage error={nameMessage.error} success={nameMessage.success} />

            <button type="submit" disabled={nameLoading} className={actionButtonClassName}>
              {nameLoading ? "Saving…" : "Save"}
            </button>
          </fieldset>
        </form>
      </Section>

      <Section title="Email" hint={email}>
        <form onSubmit={handleEmailSubmit}>
          <fieldset disabled={emailLoading} className={`${fieldsetClassName} space-y-3`}>
            {isTestEmail(email) && (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                Test emails may not receive confirmation links.
              </p>
            )}

            <div>
              <label htmlFor="profile-email" className={labelClassName}>
                New email
              </label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClassName}
                placeholder="new@email.com"
              />
            </div>

            <div>
              <label htmlFor="profile-email-password" className={labelClassName}>
                Password
              </label>
              <input
                id="profile-email-password"
                type="password"
                autoComplete="current-password"
                required
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className={inputClassName}
                placeholder="Current password"
              />
            </div>

            <FormMessage error={emailMessage.error} success={emailMessage.success} />

            <button type="submit" disabled={emailLoading} className={actionButtonClassName}>
              {emailLoading ? "Sending…" : "Update email"}
            </button>
          </fieldset>
        </form>
      </Section>

      <Section title="Password" hint="Min. 8 characters">
        <form onSubmit={handlePasswordSubmit}>
          <fieldset disabled={passwordLoading} className={`${fieldsetClassName} space-y-3`}>
            <div>
              <label htmlFor="profile-current-password" className={labelClassName}>
                Current
              </label>
              <input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="profile-new-password" className={labelClassName}>
                New
              </label>
              <div className="relative mt-1">
                <input
                  id="profile-new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClassName} !mt-0 pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="profile-confirm-password" className={labelClassName}>
                Confirm
              </label>
              <input
                id="profile-confirm-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
              />
            </div>

            <FormMessage
              error={passwordMessage.error}
              success={passwordMessage.success}
            />

            <button type="submit" disabled={passwordLoading} className={actionButtonClassName}>
              {passwordLoading ? "Updating…" : "Update password"}
            </button>
          </fieldset>
        </form>
      </Section>
    </div>
  );
}
