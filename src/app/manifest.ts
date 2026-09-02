import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

function iconMimeType(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_app_icon_url");

  const iconUrl = data ?? null;
  const type = iconUrl ? iconMimeType(iconUrl) : undefined;

  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: iconUrl
      ? [
          { src: iconUrl, sizes: "any", type, purpose: "any" },
          { src: iconUrl, sizes: "any", type, purpose: "maskable" },
        ]
      : [],
  };
}
