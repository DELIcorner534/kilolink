import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { RealtimeChat } from "@/components/realtime-chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripMini = { origin: string; destination: string };

function tripMini(t: unknown): TripMini | null {
  if (!t) {
    return null;
  }
  if (Array.isArray(t)) {
    const row = t[0] as TripMini | undefined;
    return row ?? null;
  }
  return t as TripMini;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <DashboardShell title="Messagerie temps reel">
        <EnvWarning title="Supabase non configure" />
      </DashboardShell>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: senderBookings } = await supabase
    .from("bookings")
    .select("id, status, trips(origin, destination)")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: myTrips } = await supabase.from("trips").select("id").eq("traveler_id", user.id);
  const tripIds = myTrips?.map((t) => t.id) ?? [];
  const { data: travelerBookings } =
    tripIds.length > 0
      ? await supabase
          .from("bookings")
          .select("id, status, trips(origin, destination)")
          .in("trip_id", tripIds)
          .order("created_at", { ascending: false })
          .limit(40)
      : { data: [] };

  const convoList = [...(senderBookings ?? []), ...(travelerBookings ?? [])];
  const unique = new Map(convoList.map((b) => [b.id, b]));
  const conversations = [...unique.values()];

  let bookingId = params.bookingId;
  if (!bookingId && conversations[0]) {
    bookingId = conversations[0].id;
  }

  if (!bookingId) {
    return (
      <DashboardShell title="Messagerie temps reel">
        <p className="text-slate-600">Aucune conversation disponible. Creez d&apos;abord une reservation.</p>
        <Link href="/search" className="mt-4 inline-block font-semibold text-[#0b1f4d]">
          Rechercher un trajet
        </Link>
      </DashboardShell>
    );
  }

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  return (
    <DashboardShell title="Messagerie temps reel">
      {params.success === "booking" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Reservation creee. Vous pouvez maintenant ecrire au voyageur.
        </div>
      ) : null}
      <div className="mb-6 flex flex-wrap gap-2">
        {conversations.map((b) => {
          const tr = tripMini(b.trips);
          const label = tr ? `${tr.origin} → ${tr.destination}` : "Conversation";
          const active = b.id === bookingId;
          return (
            <Link
              key={b.id}
              href={`/messages?bookingId=${encodeURIComponent(b.id)}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                active ? "bg-[#0b1f4d] text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {label} · {b.status}
            </Link>
          );
        })}
      </div>
      <RealtimeChat bookingId={bookingId} currentUserId={user.id} initialMessages={initialMessages ?? []} />
    </DashboardShell>
  );
}
