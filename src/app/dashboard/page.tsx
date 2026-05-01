import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { countMessagesForUser, sumPaymentsForUser } from "@/lib/metrics";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripEmbed = { origin: string; destination: string; departure_date: string };

function tripRow(t: unknown): TripEmbed | null {
  if (!t) {
    return null;
  }
  if (Array.isArray(t)) {
    const row = t[0] as TripEmbed | undefined;
    return row ?? null;
  }
  return t as TripEmbed;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <DashboardShell title="Dashboard utilisateur">
        <EnvWarning />
      </DashboardShell>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ count: tripsCount }, { count: bookingsAsSenderCount }, msgCount, paymentSum, { data: myTrips }, { data: bookingsAsSender }, travelerTripsRes] =
    await Promise.all([
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("traveler_id", user.id),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("sender_id", user.id),
      countMessagesForUser(supabase, user.id),
      sumPaymentsForUser(supabase),
      supabase.from("trips").select("id, origin, destination, departure_date, status").eq("traveler_id", user.id).order("created_at", { ascending: false }).limit(8),
      supabase
        .from("bookings")
        .select("id, status, kilos_requested, trip_id, trips(origin, destination, departure_date)")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("trips").select("id").eq("traveler_id", user.id),
    ]);

  const tripIds = travelerTripsRes.data?.map((t) => t.id) ?? [];
  const { data: bookingsAsTraveler } =
    tripIds.length > 0
      ? await supabase
          .from("bookings")
          .select("id, status, kilos_requested, sender_id, trip_id, trips(origin, destination, departure_date)")
          .in("trip_id", tripIds)
          .order("created_at", { ascending: false })
          .limit(16)
      : { data: [] };

  const metrics = [
    { label: "Mes trajets", value: String(tripsCount ?? 0).padStart(2, "0") },
    { label: "Reservations (expediteur)", value: String(bookingsAsSenderCount ?? 0).padStart(2, "0") },
    { label: "Messages (toutes conv.)", value: String(msgCount).padStart(2, "0") },
    { label: "Paiements confirmes", value: `${paymentSum.toFixed(2)} EUR` },
  ];

  return (
    <DashboardShell title="Dashboard utilisateur">
      {params.success === "trip" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Trajet publie avec succes. Vous pouvez maintenant suivre les demandes de reservation.
        </div>
      ) : null}
      {params.payment === "success" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Paiement recu. Merci !
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <Link
          href="/publish-trip"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm"
        >
          Publier un trajet
        </Link>
        <Link
          href="/search"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm"
        >
          Rechercher un voyageur
        </Link>
        <Link
          href="/messages"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm"
        >
          Ouvrir la messagerie
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Mes trajets</h2>
        <ul className="mt-3 space-y-2">
          {(myTrips ?? []).length === 0 ? (
            <li className="text-sm text-slate-600">Aucun trajet. Publiez-en un pour recevoir des demandes.</li>
          ) : (
            (myTrips ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span>
                  {t.origin} → {t.destination} · {t.departure_date} · {t.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Reservations recues (voyageur)</h2>
        <ul className="mt-3 space-y-2">
          {(bookingsAsTraveler ?? []).length === 0 ? (
            <li className="text-sm text-slate-600">Aucune demande pour vos trajets.</li>
          ) : (
            (bookingsAsTraveler ?? []).map((b) => {
              const tr = tripRow(b.trips);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>
                    {tr ? `${tr.origin} → ${tr.destination}` : "Trajet"} · {b.kilos_requested} kg · {b.status}
                  </span>
                  <Link href={`/booking/${b.id}`} className="font-semibold text-[#0b1f4d]">
                    Gerer
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Mes reservations (expediteur)</h2>
        <ul className="mt-3 space-y-2">
          {(bookingsAsSender ?? []).length === 0 ? (
            <li className="text-sm text-slate-600">Aucune reservation. Cherchez un trajet depuis la recherche.</li>
          ) : (
            (bookingsAsSender ?? []).map((b) => {
              const tr = tripRow(b.trips);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>
                    {tr ? `${tr.origin} → ${tr.destination}` : "Trajet"} · {b.kilos_requested} kg · {b.status}
                  </span>
                  <Link href={`/booking/${b.id}`} className="font-semibold text-[#0b1f4d]">
                    Ouvrir
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </DashboardShell>
  );
}
