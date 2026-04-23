import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvWarning } from "@/components/env-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signInAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/sign-in?error=Configuration+Supabase+manquante");
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export default async function SignInPage({
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
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Connexion</h1>
        <p className="mt-2 text-sm text-slate-500">Accedez a vos trajets, reservations et paiements.</p>
      {!supabase ? <div className="mt-6"><EnvWarning title="Supabase non configure" /></div> : null}
      {supabase ? <form action={signInAction} className="mt-6 space-y-4">
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
          required
        />
        <FormSubmitButton
          idleLabel="Se connecter"
          loadingLabel="Connexion..."
          className="w-full rounded-xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-4 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20"
        />
        {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
        <p className="text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link className="font-medium text-[#0b1f4d]" href="/auth/sign-up">
            Creez votre compte
          </Link>
        </p>
      </form> : null}
      </section>
    </main>
  );
}
