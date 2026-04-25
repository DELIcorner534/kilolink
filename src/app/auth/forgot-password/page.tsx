import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/form-submit-button";
import { EnvWarning } from "@/components/env-warning";

async function forgotPasswordAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/forgot-password?error=Configuration+Supabase+manquante");
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/update-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/forgot-password?success=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Mot de passe oublie</h1>
      <p className="mt-2 text-sm text-slate-600">Entrez votre email pour recevoir un lien de reinitialisation.</p>

      {!supabase ? <div className="mt-6"><EnvWarning title="Supabase non configure" /></div> : null}
      {supabase ? (
        <form action={forgotPasswordAction} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 p-3"
            placeholder="Email"
          />
          <FormSubmitButton
            idleLabel="Envoyer lien de reinitialisation"
            loadingLabel="Envoi..."
            className="w-full rounded-xl bg-[#0b1f4d] px-4 py-3 font-semibold !text-white"
          />
          {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
          {params.success ? (
            <p className="text-sm text-emerald-700">Email envoye. Verifiez votre boite de reception.</p>
          ) : null}
        </form>
      ) : null}
    </main>
  );
}
