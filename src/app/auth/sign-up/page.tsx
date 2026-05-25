import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvWarning } from "@/components/env-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PasswordField } from "@/components/password-field";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  findProfileByReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from "@/lib/referral";

async function signUpAction(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const referralCodeRaw = String(formData.get("referralCode") ?? "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/sign-up?error=Configuration+Supabase+manquante");
  }

  // Validate display name: allow one or more words, letters + separators only.
  // Each word must be at least 4 characters.
  const normalizedName = fullName.replace(/\s+/g, " ").trim();
  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  const words = normalizedName.split(" ").filter(Boolean);
  const hasShortWord = words.some((word) => word.length < 4);
  if (!normalizedName || !namePattern.test(normalizedName) || hasShortWord) {
    redirect(`/auth/sign-up?error=${encodeURIComponent("Chaque mot du nom doit avoir au moins 4 caractères.")}`);
  }

  const signUpOptions: {
    data: { full_name: string };
    emailRedirectTo?: string;
  } = {
    data: {
      full_name: normalizedName,
    },
  };

  if (appUrl) {
    signUpOptions.emailRedirectTo = `${appUrl}/auth/sign-in`;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions,
  });

  if (error) {
    redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    let referredById: string | null = null;
    if (referralCodeRaw && isValidReferralCodeFormat(referralCodeRaw)) {
      const found = await findProfileByReferralCode(supabase, normalizeReferralCode(referralCodeRaw));
      referredById = found?.id ?? null;
    }
    const payload: Record<string, unknown> = {
      user_id: data.user.id,
      full_name: normalizedName,
    };
    if (referredById) {
      payload.referred_by = referredById;
      payload.referred_at = new Date().toISOString();
    }
    await supabase.from("profiles").upsert(payload);
  }

  if (!data.session) {
    redirect(`/auth/sign-in?notice=${encodeURIComponent("Confirmez votre e-mail avant de vous connecter.")}`);
  }

  redirect("/dashboard");
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const prefilledRef = params.ref ? normalizeReferralCode(params.ref) : "";

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Espace membre</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Inscription</h1>
      <p className="mt-2 text-sm text-slate-500">Créez votre compte pour publier, réserver et suivre vos envois.</p>
      {!supabase ? <div className="mt-6"><EnvWarning title="Supabase non configuré" /></div> : null}
      {supabase ? <form action={signUpAction} className="mt-6 space-y-4">
        <input
          name="fullName"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Nom complet (min. 4 caractères par mot)"
          minLength={4}
          pattern="[A-Za-zÀ-ÖØ-öø-ÿ' -]{4,}"
          title="Chaque mot doit contenir au moins 4 caractères."
          required
        />
        <input
          name="email"
          type="email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Email"
          required
        />
        <PasswordField
          name="password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
          placeholder="Mot de passe"
          minLength={8}
          required
        />
        <div className="rounded-xl border border-dashed border-emerald-300/70 bg-emerald-50/40 p-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <span aria-hidden>🎁</span> Code parrain (optionnel)
          </label>
          <input
            name="referralCode"
            defaultValue={prefilledRef}
            placeholder="KL-XXXXXX"
            maxLength={9}
            className="mt-2 w-full rounded-lg border border-emerald-200 bg-white p-2.5 text-sm uppercase tracking-[0.15em] outline-none ring-emerald-300/40 transition focus:ring-4"
          />
          <p className="mt-2 text-xs text-emerald-700/80">
            Un ami vous a invité ? Saisissez son code pour obtenir -5 % sur votre 1er envoi.
          </p>
        </div>
        <FormSubmitButton
          idleLabel="Creer un compte"
          loadingLabel="Creation..."
          className="w-full rounded-xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-4 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20"
        />
        {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
        <p className="text-sm text-slate-500">
          Déjà membre ?{" "}
          <Link className="font-medium text-[#0b1f4d]" href="/auth/sign-in">
            Connectez-vous
          </Link>
        </p>
      </form> : null}
      </section>
    </main>
  );
}
