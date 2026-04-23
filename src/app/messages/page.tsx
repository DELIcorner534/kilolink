import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { RealtimeChat } from "@/components/realtime-chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  let bookingId = params.bookingId;

  if (!bookingId) {
    const { data: firstBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    bookingId = firstBooking?.id;
  }

  if (!bookingId) {
    return (
      <DashboardShell title="Messagerie temps reel">
        <p className="text-slate-600">Aucune conversation disponible. Creez d&apos;abord une reservation.</p>
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
      <RealtimeChat bookingId={bookingId} currentUserId={user.id} initialMessages={initialMessages ?? []} />
    </DashboardShell>
  );
}
