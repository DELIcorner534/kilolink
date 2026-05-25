"use client";

import { useEffect, useState } from "react";

type Props = {
  status: "success" | "cancel";
  deepLink: string;
};

export default function StripeReturnClient({ status, deepLink }: Props) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // The full-screen overlay has its own background, but we also paint the
    // body so the SiteHeader/SiteFooter beneath us disappear visually even
    // before the redirect happens.
    const prevBg = document.body.style.background;
    const prevOverflow = document.body.style.overflow;
    document.body.style.background = "#0a0b10";
    document.body.style.overflow = "hidden";

    // Try the native deep link.
    try {
      window.location.replace(deepLink);
    } catch {
      // ignore
    }

    // If iOS/Android didn't intercept the scheme within 1.5s, surface a manual
    // button so the user can finish the trip back to the app.
    const t = setTimeout(() => setShowFallback(true), 1500);

    return () => {
      clearTimeout(t);
      document.body.style.background = prevBg;
      document.body.style.overflow = prevOverflow;
    };
  }, [deepLink]);

  const isSuccess = status === "success";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(77,141,255,0.18), transparent 55%), #0a0b10",
        color: "#fff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-[420px] text-center">
        <div
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: isSuccess
              ? "rgba(52,211,153,0.14)"
              : "rgba(248,113,113,0.14)",
            border: `1px solid ${
              isSuccess ? "rgba(52,211,153,0.32)" : "rgba(248,113,113,0.32)"
            }`,
            boxShadow: isSuccess
              ? "0 0 60px rgba(52,211,153,0.18)"
              : "0 0 60px rgba(248,113,113,0.18)",
          }}
        >
          {isSuccess ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
        </div>

        <div
          className="mb-3 text-[11px] font-extrabold uppercase"
          style={{ letterSpacing: "2px", color: "#4d8dff" }}
        >
          KiloLink · Paiement
        </div>

        <h1
          className="m-0 text-[34px] font-extrabold leading-tight"
          style={{ letterSpacing: "-1px" }}
        >
          {isSuccess ? (
            <>
              Paiement
              <br />
              <span style={{ color: "#34d399" }}>confirmé.</span>
            </>
          ) : (
            <>
              Paiement
              <br />
              <span style={{ color: "#f87171" }}>annulé.</span>
            </>
          )}
        </h1>

        <p
          className="mx-auto mt-4 max-w-[340px] text-[14px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {isSuccess
            ? "Le voyageur est notifié. Vous allez être redirigé vers l’app pour voir le détail de votre réservation."
            : "Aucun débit n’a été effectué. Retournez dans l’app KiloLink quand vous voulez pour réessayer."}
        </p>

        {/* Spinner pendant la tentative de redirection */}
        {!showFallback ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#4d8dff", animationDelay: "0ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#4d8dff", animationDelay: "150ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#4d8dff", animationDelay: "300ms" }}
            />
            <span
              className="ml-2 text-[12px] font-semibold"
              style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.4px" }}
            >
              Retour vers l’app…
            </span>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={deepLink}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-extrabold transition active:scale-[0.98]"
              style={{
                background: "#fff",
                color: "#0a0b10",
                boxShadow: "0 8px 28px rgba(77,141,255,0.18)",
              }}
            >
              Ouvrir l’app KiloLink
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
            <p
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.4px" }}
            >
              Si rien ne se passe, l’app n’est pas installée sur cet appareil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
