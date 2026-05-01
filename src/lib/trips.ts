import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trip } from "@/lib/types";

type TripRow = {
  id: string;
  traveler_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  kilos_available: number;
  price_per_kg: number;
  airline: string | null;
  status?: string;
};

export async function fetchActiveTripsWithProfiles(
  supabase: SupabaseClient,
  opts?: { origin?: string; destination?: string; date?: string; limit?: number },
): Promise<Trip[]> {
  let q = supabase
    .from("trips")
    .select("*")
    .eq("status", "active")
    .order("departure_date", { ascending: true })
    .limit(opts?.limit ?? 24);

  if (opts?.origin) {
    q = q.ilike("origin", `%${opts.origin}%`);
  }
  if (opts?.destination) {
    q = q.ilike("destination", `%${opts.destination}%`);
  }
  if (opts?.date) {
    q = q.eq("departure_date", opts.date);
  }

  const { data: trips, error } = await q;
  if (error || !trips?.length) {
    return [];
  }

  const rows = trips as TripRow[];
  const travelerIds = [...new Set(rows.map((t) => t.traveler_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, rating, avatar_url")
    .in("user_id", travelerIds);

  const byUser = new Map((profiles ?? []).map((p) => [p.user_id as string, p]));

  return rows.map((trip) => {
    const p = byUser.get(trip.traveler_id);
    const name = p?.full_name ?? "Voyageur";
    const initial = name.trim().charAt(0).toUpperCase() || "V";
    const rating = p?.rating != null ? Number(p.rating) : 5;
    return {
      id: trip.id,
      travelerName: name,
      travelerAvatar: initial,
      rating,
      origin: trip.origin,
      destination: trip.destination,
      departureDate: trip.departure_date,
      kilosAvailable: trip.kilos_available,
      pricePerKg: Number(trip.price_per_kg),
      airline: trip.airline ?? "N/A",
    };
  });
}
