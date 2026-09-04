import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface MemberOption {
  id: string;
  name: string;
}

/**
 * Members of the current org, for assignment pickers (contact/company/deal
 * owner). Two queries + a JS merge, same as everywhere else this session —
 * the hand-authored Database types carry no relationship metadata for
 * Postgrest's embedded-select syntax.
 */
export async function getOrgMemberOptions(
  supabase: SupabaseClient<Database>,
): Promise<MemberOption[]> {
  const { data: members } = await supabase.from("organization_members").select("user_id");
  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name || p.email,
  }));
}
