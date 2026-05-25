import type { SupabaseClient } from "@supabase/supabase-js";

export async function isProfileAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role === "admin";
}
