"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Mot de passe mis a jour avec succes. Redirection...");
    setTimeout(() => router.push("/auth/sign-in"), 1200);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Espace membre</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-slate-500">Saisissez votre nouveau mot de passe pour finaliser la reinitialisation.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordField
            name="password"
            placeholder="Nouveau mot de passe"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
            required
            minLength={8}
          />
          <PasswordField
            name="confirmPassword"
            placeholder="Confirmer le mot de passe"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
            required
            minLength={8}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-4 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        </form>
      </section>
    </main>
  );
}
