import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { BookingPayButton } from "@/components/booking-pay-button";
import { RealtimeChat } from "@/components/realtime-chat";
import { bookingStatusFormAction, reviewFormAction } from "@/app/booking/[id]/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripEmbed = {
  traveler_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  price_per_kg: number;
  kilos_available: number;
  airline: string | null;
  status: string;
};

function tripFromBooking(booking: { trips: TripEmbed | TripEmbed[] | null }): TripEmbed | null {
  const t = booking.trips;
  if (!t) {
    return null;
  }
  return Array.isArray(t) ? t[0] ?? null : t;
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; new?: string; payment?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <DashboardShell title="Reservation">
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

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, status, sender_id, trip_id, kilos_requested, parcel_description, parcel_value, created_at, trips(traveler_id, origin, destination, departure_date, price_per_kg, kilos_available, airline, status)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) {
    return (
      <DashboardShell title="Reservation">
        <p className="text-slate-600">Reservation introuvable.</p>
        <Link href="/dashboard" className="mt-4 inline-block font-semibold text-[#0b1f4d]">
          Retour au tableau de bord
        </Link>
      </DashboardShell>
    );
  }

  const trip = tripFromBooking(booking as { trips: TripEmbed | TripEmbed[] | null });
  if (!trip) {
    return (
      <DashboardShell title="Reservation">
        <p className="text-slate-600">Trajet introuvable.</p>
      </DashboardShell>
    );
  }

  const isTraveler = trip.traveler_id === user.id;
  const isSender = booking.sender_id === user.id;
  if (!isTraveler && !isSender) {
    return (
      <DashboardShell title="Reservation">
        <p className="text-slate-600">Acces refuse.</p>
        <Link href="/dashboard" className="mt-4 inline-block font-semibold text-[#0b1f4d]">
          Retour
        </Link>
      </DashboardShell>
    );
  }

  const [{ data: profiles }, { data: payments }, { data: myReview }, { data: initialMessages }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", [trip.traveler_id, booking.sender_id]),
    supabase.from("payments").select("id, amount, commission, status, created_at").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("reviews").select("id, rating, comment").eq("booking_id", id).eq("reviewer_id", user.id).maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const nameByUser = new Map((profiles ?? []).map((p) => [p.user_id as string, p.full_name as string]));
  const travelerName = nameByUser.get(trip.traveler_id) ?? "Voyageur";
  const senderName = nameByUser.get(booking.sender_id) ?? "Expediteur";
  const peerLabel = isTraveler ? senderName : travelerName;
  const totalEur = Number(booking.kilos_requested) * Number(trip.price_per_kg);
  const hasPaid = (payments ?? []).some((p) => p.status === "paid");
  const canPay = isSender && booking.status === "accepted" && !hasPaid;

  return (
    <DashboardShell title="Detail reservation">
      {q.new === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Reservation creee. Le voyageur peut accepter ou refuser. Vous pouvez echanger ci-dessous.
        </div>
      ) : null}
      {q.payment === "success" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Paiement confirme. Merci !
        </div>
      ) : null}
      {q.payment === "cancel" ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Paiement annule. Vous pouvez reessayer quand vous voulez.
        </div>
      ) : null}
      {q.error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{q.error}</div>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Trajet</p>
          <p className="mt-1 font-semibold text-slate-900">
            {trip.origin} → {trip.destination}
          </p>
          <p className="mt-1 text-sm text-slate-600">Depart: {trip.departure_date}</p>
          <p className="text-sm text-slate-600">Statut trajet: {trip.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Reservation</p>
          <p className="mt-1 text-sm text-slate-700">
            Statut: <span className="font-semibold">{booking.status}</span>
          </p>
          <p className="text-sm text-slate-700">Kilos: {booking.kilos_requested}</p>
          <p className="text-sm text-slate-700">
            Prix estime: {totalEur.toFixed(2)} EUR ({trip.price_per_kg} EUR/kg)
          </p>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {isTraveler && booking.status === "pending" ? (
          <>
            <form action={bookingStatusFormAction}>
              <input type="hidden" name="bookingId" value={id} />
              <input type="hidden" name="nextStatus" value="accepted" />
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Accepter
              </button>
            </form>
            <form action={bookingStatusFormAction}>
              <input type="hidden" name="bookingId" value={id} />
              <input type="hidden" name="nextStatus" value="rejected" />
              <button type="submit" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                Refuser
              </button>
            </form>
          </>
        ) : null}
        {isSender && booking.status === "pending" ? (
          <form action={bookingStatusFormAction}>
            <input type="hidden" name="bookingId" value={id} />
            <input type="hidden" name="nextStatus" value="cancelled" />
            <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800">
              Annuler la demande
            </button>
          </form>
        ) : null}
        {(isTraveler || isSender) && booking.status === "accepted" ? (
          <form action={bookingStatusFormAction}>
            <input type="hidden" name="bookingId" value={id} />
            <input type="hidden" name="nextStatus" value="completed" />
            <button type="submit" className="rounded-xl bg-[#0b1f4d] px-4 py-2 text-sm font-semibold text-white">
              Marquer comme terminee
            </button>
          </form>
        ) : null}
      </section>

      {canPay ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold text-slate-900">Paiement</p>
          <p className="mt-1 text-sm text-slate-600">Montant du: {totalEur.toFixed(2)} EUR (commission plateforme ~10% enregistree).</p>
          <BookingPayButton bookingId={id} />
        </section>
      ) : null}

      {(payments ?? []).length > 0 ? (
        <section className="mt-6">
          <p className="font-semibold text-slate-900">Historique paiements</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {(payments ?? []).map((p) => (
              <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2">
                {Number(p.amount).toFixed(2)} EUR — {p.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {booking.status === "completed" && !myReview ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold text-slate-900">Laisser un avis</p>
          <p className="mt-1 text-sm text-slate-600">Une seule evaluation par reservation.</p>
          <form action={reviewFormAction} className="mt-4 space-y-3">
            <input type="hidden" name="bookingId" value={id} />
            <input type="hidden" name="reviewedUserId" value={isSender ? trip.traveler_id : booking.sender_id} />
            <label className="block text-sm font-medium text-slate-700">
              Note (1-5)
              <select name="rating" required className="mt-1 w-full rounded-xl border border-slate-200 p-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Commentaire
              <textarea name="comment" className="mt-1 w-full rounded-xl border border-slate-200 p-2" rows={3} />
            </label>
            <button type="submit" className="rounded-xl bg-[#0b1f4d] px-4 py-2 text-sm font-semibold text-white">
              Publier l&apos;avis
            </button>
          </form>
        </section>
      ) : null}

      {myReview ? (
        <p className="mt-6 text-sm text-emerald-800">Votre avis ({myReview.rating}/5) a ete enregistre.</p>
      ) : null}

      <section className="mt-8">
        <p className="mb-3 font-semibold text-slate-900">Messagerie</p>
        <RealtimeChat bookingId={id} currentUserId={user.id} initialMessages={initialMessages ?? []} peerLabel={peerLabel} />
      </section>

      <div className="mt-6">
        <Link href="/dashboard" className="text-sm font-semibold text-[#0b1f4d]">
          ← Tableau de bord
        </Link>
      </div>
    </DashboardShell>
  );
}
