import { TripCard } from "@/components/trip-card";
import { EnvWarning } from "@/components/env-warning";
import { supportedCities } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string; destination?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Recherche voyageurs</h1>
          <p className="mt-2 text-slate-600">Filtrez par ville de depart, ville de destination, date, kilos et prix.</p>
          <div className="mt-6">
            <EnvWarning title="Supabase non configure" />
          </div>
        </section>
      </main>
    );
  }

  let query = supabase.from("trips").select("*").order("departure_date", { ascending: true }).limit(24);

  if (params.origin) {
    query = query.ilike("origin", `%${params.origin}%`);
  }
  if (params.destination) {
    query = query.ilike("destination", `%${params.destination}%`);
  }
  if (params.date) {
    query = query.eq("departure_date", params.date);
  }

  const { data } = await query;

  const tripCards: Trip[] =
    data?.map((trip) => ({
      id: trip.id,
      travelerName: "Voyageur verifie",
      travelerAvatar: "V",
      rating: 5,
      origin: trip.origin,
      destination: trip.destination,
      departureDate: trip.departure_date,
      kilosAvailable: trip.kilos_available,
      pricePerKg: Number(trip.price_per_kg),
      airline: trip.airline ?? "N/A",
    })) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Recherche voyageurs</h1>
        <p className="mt-2 text-slate-600">Filtrez par ville de depart, ville de destination, date, kilos et prix.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {supportedCities.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            {city}
          </span>
        ))}
      </div>
      <form className="mt-6 grid gap-4 md:grid-cols-5">
        <select
          name="origin"
          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          defaultValue={params.origin ?? ""}
        >
          <option value="">Ville de depart (toutes)</option>
          {supportedCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          name="destination"
          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          defaultValue={params.destination ?? ""}
        >
          <option value="">Ville d&apos;arrivee (toutes)</option>
          {supportedCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <input name="date" type="date" className="rounded-xl border border-slate-200 bg-slate-50 p-3" defaultValue={params.date} />
        <button className="rounded-xl bg-slate-900 p-3 font-semibold !text-white">Appliquer</button>
        <Link
          href="/search"
          className="rounded-xl border border-slate-200 bg-white p-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reinitialiser
        </Link>
      </form>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tripCards.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
        {tripCards.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 md:col-span-2 lg:col-span-3">
            <p className="font-semibold text-slate-900">Aucun trajet trouve pour ce filtre.</p>
            <p className="mt-1">Essayez une autre date ou publiez votre propre trajet.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/publish-trip" className="rounded-xl bg-[#0b1f4d] px-4 py-2 text-sm font-semibold !text-white">
                Publier un trajet
              </Link>
              <Link href="/search" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Reinitialiser la recherche
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
