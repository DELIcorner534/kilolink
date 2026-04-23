"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [bookingId, setBookingId] = useState("");
  const [amountInEur, setAmountInEur] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amountInEur }),
    });

    const data = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError(data.error ?? "Impossible de demarrer le paiement. Verifiez les champs.");
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="font-semibold text-slate-900">Paiement Stripe (test)</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input
          className="rounded-xl border border-slate-200 p-3"
          placeholder="Booking ID"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 p-3"
          placeholder="Montant EUR"
          type="number"
          min={1}
          value={amountInEur}
          onChange={(event) => setAmountInEur(Number(event.target.value))}
        />
        <button
          type="button"
          onClick={startCheckout}
          disabled={!bookingId || !amountInEur || loading}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Payer maintenant"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
