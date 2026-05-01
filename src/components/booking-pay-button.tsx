"use client";

import { useState } from "react";

type BookingPayButtonProps = {
  bookingId: string;
};

export function BookingPayButton({ bookingId }: BookingPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Paiement indisponible");
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Redirection..." : "Payer avec Stripe"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
