import { redirect } from "next/navigation";

import { AppIconSettingsForm } from "@/components/profile/app-icon-settings-form";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { pageTitleClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = String(user.user_metadata?.display_name ?? "");

  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("icon_url")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <h1 className={pageTitleClassName}>Settings</h1>

      <AppIconSettingsForm currentIconUrl={appSettings?.icon_url ?? null} />

      <ProfileSettingsForm
        email={user.email ?? ""}
        displayName={displayName}
      />
    </div>
  );
}
