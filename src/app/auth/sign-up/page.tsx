import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvWarning } from "@/components/env-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signUpAction(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/sign-up?error=Configuration+Supabase+manquante");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      user_id: data.user.id,
      full_name: fullName,
    });
  }

  redirect("/dashboard");
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Espace membre</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Inscription</h1>
      <p className="mt-2 text-sm text-slate-500">Creez votre compte pour publier, reserver et suivre vos envois.</p>
      {!supabase ? <div className="mt-6"><EnvWarning title="Supabase non configure" /></div> : null}
      {supabase ? <form action={signUpAction} className="mt-6 space-y-4">
        <input
          name="fullName"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Nom complet"
          required
        />
        <input
          name="email"
          type="email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Email"
          required
        />
        <input
          name="password"
          type="password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Mot de passe"
          minLength={8}
          required
        />
        <FormSubmitButton
          idleLabel="Creer un compte"
          loadingLabel="Creation..."
          className="w-full rounded-xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-4 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20"
        />
        {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
        <p className="text-sm text-slate-500">
          Deja membre ?{" "}
          <Link className="font-medium text-[#0b1f4d]" href="/auth/sign-in">
            Connectez-vous
          </Link>
        </p>
      </form> : null}
      </section>
    </main>
  );
}
