import { redirect } from "next/navigation";

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

  return (
    <div className="space-y-4">
      <h1 className={pageTitleClassName}>Profile</h1>

      <ProfileSettingsForm
        email={user.email ?? ""}
        displayName={displayName}
      />
    </div>
  );
}
