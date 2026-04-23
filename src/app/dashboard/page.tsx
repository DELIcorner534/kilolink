import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
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

  const [{ count: tripsCount }, { count: bookingsCount }, { count: messagesCount }, { data: payments }] =
    await Promise.all([
      supabase.from("trips").select("*", { count: 'exact' }).eq("traveler_id", user.id),
      supabase.from("bookings").select("*", { count: 'exact' }).eq("sender_id", user.id),
      supabase.from("messages").select("*", { count: 'exact' }).eq("sender_id", user.id),
      supabase.from("payments").select("amount").limit(100),
    ]);

  const paymentSum = (payments ?? []).reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);
  const metrics = [
    { label: "Mes trajets", value: String(tripsCount ?? 0).padStart(2, "0") },
    { label: "Reservations", value: String(bookingsCount ?? 0).padStart(2, "0") },
    { label: "Messages", value: String(messagesCount ?? 0).padStart(2, "0") },
    { label: "Paiements", value: `${paymentSum.toFixed(2)} EUR` },
  ];

  return (
    <DashboardShell title="Dashboard utilisateur">
      {params.success === "trip" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Trajet publie avec succes. Vous pouvez maintenant suivre les demandes de reservation.
        </div>
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
    </DashboardShell>
  );
}
