"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormMessage, cardClassName } from "@/components/ui/form";
import { formatAppError } from "@/lib/errors";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

type AppIconSettingsFormProps = {
  currentIconUrl: string | null;
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const STORAGE_URL_MARKER = "/storage/v1/object/public/branding/";

function extensionForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function storagePathFromPublicUrl(url: string) {
  const index = url.indexOf(STORAGE_URL_MARKER);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + STORAGE_URL_MARKER.length));
}

export function AppIconSettingsForm({ currentIconUrl }: AppIconSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconUrl, setIconUrl] = useState(currentIconUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ error: "Use a PNG, JPG, or WEBP image." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setMessage({ error: "Image must be smaller than 2MB." });
      return;
    }

    setMessage({});
    setBusy(true);

    const supabase = createClient();
    const previousPath = iconUrl ? storagePathFromPublicUrl(iconUrl) : null;
    const path = `icon-${Date.now()}.${extensionForType(file.type)}`;

    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setMessage({ error: formatAppError(uploadError, "Could not upload image.") });
      setBusy(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("branding").getPublicUrl(path);
    const newUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ icon_url: newUrl, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (updateError) {
      // Roll back the orphaned upload so it doesn't linger in storage.
      await supabase.storage.from("branding").remove([path]);
      setMessage({ error: formatAppError(updateError, "Could not save app icon.") });
      setBusy(false);
      return;
    }

    if (previousPath) {
      await supabase.storage.from("branding").remove([previousPath]);
    }

    setIconUrl(newUrl);
    setMessage({
      success:
        "App icon updated. If you already added this app to your home screen, remove it and add it again to see the new icon.",
    });
    setBusy(false);
    router.refresh();
  }

  async function handleRemove() {
    if (busy || !iconUrl) return;
    setMessage({});
    setBusy(true);

    const supabase = createClient();
    const path = storagePathFromPublicUrl(iconUrl);

    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ icon_url: null, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (updateError) {
      setMessage({ error: formatAppError(updateError, "Could not remove app icon.") });
      setBusy(false);
      return;
    }

    if (path) {
      await supabase.storage.from("branding").remove([path]);
    }

    setIconUrl(null);
    setMessage({ success: "App icon removed." });
    setBusy(false);
    router.refresh();
  }

  return (
    <section className={cardClassName}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">App icon</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Shown when you add {BRAND.name} to your phone&rsquo;s home screen
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--card-border)] bg-emerald-600 text-lg font-bold text-white dark:bg-emerald-500">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="App icon" className="h-full w-full object-cover" />
          ) : (
            BRAND.shortName
          )}
        </div>

        <div className="flex flex-1 flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-10 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {busy ? "Working…" : iconUrl ? "Change icon" : "Upload icon"}
          </button>
          {iconUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="min-h-10 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-3">
        <FormMessage error={message.error} success={message.success} />
      </div>
    </section>
  );
}
