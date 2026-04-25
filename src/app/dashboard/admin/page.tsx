import { DashboardShell } from "@/components/dashboard-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const adminStats = [
  { label: "Utilisateurs", value: "1 245" },
  { label: "Trajets actifs", value: "284" },
  { label: "Revenus", value: "28 300 EUR" },
  { label: "Litiges", value: "04" },
  { label: "Signalements", value: "11" },
];

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell title="Admin panel">
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
