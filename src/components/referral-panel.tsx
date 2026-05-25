"use client";

import { useState } from "react";
import { buildReferralShareMessage } from "@/lib/referral";

type Props = {
  code: string;
  stats: {
    totalInvited: number;
    rewardsEarned: number;
    rewardsAvailable: number;
  };
  /** URL publique du site, transmise depuis le serveur pour éviter d'avoir l'IP locale en dev. */
  publicSiteUrl: string;
};

export function ReferralPanel({ code, stats, publicSiteUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${publicSiteUrl.replace(/\/+$/, "")}/auth/sign-up?ref=${code}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const onShare = async () => {
    const message = buildReferralShareMessage(code, referralLink);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Rejoins-moi sur KiloLink", text: message, url: referralLink });
        return;
      } catch {
        // user dismissed or unsupported — fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <section
      className="mt-10 overflow-hidden rounded-3xl p-6 text-white shadow-[0_18px_60px_rgba(11,31,77,0.28)]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #0b1f4d 0%, #1e3a8a 65%, #10b981 100%)",
      }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
        <span aria-hidden>🎁</span> Parrainage
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Invitez vos amis, gagnez -5 %</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
        Pour chaque ami qui fait sa 1<sup>re</sup> réservation, vous recevez tous les deux -5 % sur votre prochain
        envoi.
      </p>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/25 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">Votre code</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em]">{code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#0b1f4d] shadow-md transition hover:shadow-lg"
          >
            Partager mon code
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/85 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <div className="break-all">
          <span className="font-semibold text-white/70">Lien direct&nbsp;:</span> {referralLink}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-5 text-center">
        <div>
          <dd className="text-2xl font-bold">{stats.totalInvited}</dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Amis invités
          </dt>
        </div>
        <div className="border-x border-white/15">
          <dd className="text-2xl font-bold">{stats.rewardsAvailable}</dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Bons -5 % dispo
          </dt>
        </div>
        <div>
          <dd className="text-2xl font-bold">{stats.rewardsEarned}</dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Total gagné
          </dt>
        </div>
      </dl>
    </section>
  );
}
