import { DashboardShell } from "@/components/dashboard-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/sign-in");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const adminClient = createSupabaseAdminClient();

  let adminStats: { label: string; value: string }[] = [
    { label: "Utilisateurs (profils)", value: "—" },
    { label: "Trajets", value: "—" },
    { label: "Reservations", value: "—" },
    { label: "Paiements payes (count)", value: "—" },
    { label: "Litiges ouverts", value: "—" },
  ];

  if (adminClient) {
    const [profiles, trips, bookings, paidPayments, openDisputes] = await Promise.all([
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("trips").select("id", { count: "exact", head: true }),
      adminClient.from("bookings").select("id", { count: "exact", head: true }),
      adminClient.from("payments").select("id", { count: "exact", head: true }).eq("status", "paid"),
      adminClient.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    adminStats = [
      { label: "Utilisateurs (profils)", value: String(profiles.count ?? 0) },
      { label: "Trajets", value: String(trips.count ?? 0) },
      { label: "Reservations", value: String(bookings.count ?? 0) },
      { label: "Paiements payes", value: String(paidPayments.count ?? 0) },
      { label: "Litiges ouverts", value: String(openDisputes.count ?? 0) },
    ];
  }

  return (
    <DashboardShell title="Admin panel">
      {!adminClient ? (
        <p className="mb-4 text-sm text-amber-800">
          Ajoutez <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> pour afficher les statistiques
          temps reel.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminStats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
