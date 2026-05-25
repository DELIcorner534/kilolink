"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    const data = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError(data.error ?? "Impossible de démarrer le paiement. Vérifiez l’identifiant de réservation.");
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="font-semibold text-slate-900">Paiement Stripe (test)</p>
      <p className="mt-1 text-xs text-slate-500">Le montant est celui de la réservation (kilos × prix au kg).</p>
      <div className="mt-3 flex flex-wrap gap-3 md:grid md:grid-cols-[1fr_auto]">
        <input
          className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 p-3"
          placeholder="ID de la réservation"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
        />
        <button
          type="button"
          onClick={startCheckout}
          disabled={!bookingId.trim() || loading}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Chargement…" : "Payer maintenant"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
