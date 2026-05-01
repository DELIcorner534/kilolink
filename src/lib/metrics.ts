import type { SupabaseClient } from "@supabase/supabase-js";

export async function countMessagesForUser(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data: myTrips } = await supabase.from("trips").select("id").eq("traveler_id", userId);
  const tripIds = myTrips?.map((t) => t.id) ?? [];
  let travelerBookingIds: string[] = [];
  if (tripIds.length) {
    const { data: tb } = await supabase.from("bookings").select("id").in("trip_id", tripIds);
    travelerBookingIds = tb?.map((b) => b.id) ?? [];
  }
  const { data: sb } = await supabase.from("bookings").select("id").eq("sender_id", userId);
  const senderBookingIds = sb?.map((b) => b.id) ?? [];
  const all = [...new Set([...travelerBookingIds, ...senderBookingIds])];
  if (!all.length) {
    return 0;
  }
  const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).in("booking_id", all);
  return count ?? 0;
}

export async function sumPaymentsForUser(supabase: SupabaseClient): Promise<number> {
  const { data: rows } = await supabase.from("payments").select("amount, status");
  const paid = (rows ?? []).filter((p) => p.status === "paid");
  return paid.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
}
