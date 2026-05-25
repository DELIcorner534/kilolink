import type { SupabaseClient } from "@supabase/supabase-js";

export type ReferralReward = {
  id: string;
  recipient_id: string;
  role: "referrer" | "referee";
  triggered_by_booking: string | null;
  related_user_id: string | null;
  discount_percent: number;
  status: "pending" | "used" | "expired";
  used_on_booking: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
};

export type ReferralProfileInfo = {
  id: string;
  user_id: string;
  full_name: string;
};

export function normalizeReferralCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

const REFERRAL_CODE_PATTERN = /^KL-[A-Z2-9]{6}$/;

export function isValidReferralCodeFormat(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(normalizeReferralCode(code));
}

export async function findProfileByReferralCode(
  supabase: SupabaseClient,
  code: string,
): Promise<ReferralProfileInfo | null> {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCodeFormat(normalized)) return null;
  const { data, error } = await supabase.rpc("find_profile_by_referral_code", { p_code: normalized });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as ReferralProfileInfo;
}

export async function fetchMyReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.referral_code as string | undefined) ?? null;
}

export async function fetchBestAvailableReward(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralReward | null> {
  const { data } = await supabase
    .from("referral_rewards")
    .select("*")
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1);
  return ((data ?? [])[0] as ReferralReward | undefined) ?? null;
}

export async function fetchMyRewards(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralReward[]> {
  const { data } = await supabase
    .from("referral_rewards")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ReferralReward[];
}

export type ReferralStats = {
  totalInvited: number;
  rewardsEarned: number;
  rewardsAvailable: number;
};

export async function fetchReferralStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralStats> {
  const [{ data: profile }, { data: rewards }] = await Promise.all([
    supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("referral_rewards").select("status, role").eq("recipient_id", userId),
  ]);

  let totalInvited = 0;
  if (profile?.id) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", profile.id);
    totalInvited = count ?? 0;
  }

  const rs = (rewards ?? []) as { status: string; role: string }[];
  return {
    totalInvited,
    rewardsEarned: rs.length,
    rewardsAvailable: rs.filter((r) => r.status === "pending").length,
  };
}

export async function applyRewardToBooking(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<number> {
  const { data } = await supabase.rpc("apply_reward_to_booking", { p_booking_id: bookingId });
  if (!data) return 0;
  const row = Array.isArray(data) ? data[0] : data;
  return (row?.discount_percent as number | undefined) ?? 0;
}

export function buildReferralShareMessage(code: string, link: string): string {
  return [
    "Je t'invite à découvrir KiloLink — l'app pour envoyer tes colis grâce aux voyageurs.",
    "",
    `Utilise mon code ${code} à l'inscription :`,
    "tu auras -5 % sur ton 1er envoi (et moi aussi 🎁).",
    "",
    link,
  ].join("\n");
}
