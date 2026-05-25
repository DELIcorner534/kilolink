import Link from "next/link";
import type { Metadata } from "next";

/**
 * Lien direct vers le dernier build APK Android publié sur EAS.
 *
 * Pour mettre à jour : ajoute `NEXT_PUBLIC_ANDROID_APK_URL=...` dans `.env.local`
 * (ou édite le fallback ci-dessous) après chaque nouveau `eas build`.
 */
const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL ??
  "https://expo.dev/accounts/amougba/projects/kilolink-app/builds/f559257a-de45-4c75-a2ae-7d6d92833e3e";

export const metadata: Metadata = {
  title: "Télécharger l'app KiloLink",
  description:
    "Téléchargez l'app KiloLink sur Android. Trouvez un voyageur, réservez vos kilos et payez en toute sécurité depuis votre téléphone.",
  openGraph: {
    title: "Télécharger l'app KiloLink",
    description: "Envoyez et transportez des colis entre la Belgique et l'Afrique, depuis votre téléphone.",
  },
};

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-100 text-lg">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{desc}</p>
      </div>
    </li>
  );
}

export default function DownloadAppPage() {
  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 py-12 md:py-20">
      {/* Glow décoratif */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden />

      <div className="relative grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
        {/* Colonne gauche : pitch + CTA */}
        <section>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <span aria-hidden>🎉</span> Nouveau · Disponible sur Android
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Téléchargez{" "}
            <span className="bg-gradient-to-r from-[#0b1f4d] via-[#1d3f8f] to-[#10b981] bg-clip-text text-transparent">
              KiloLink
            </span>
            <br />
            sur votre téléphone.
          </h1>
          <p className="mt-4 max-w-xl text-slate-600 md:text-lg">
            Envoyez ou transportez des colis entre la Belgique et l&apos;Afrique. Réservation,
            messagerie, paiement sécurisé — tout dans la poche.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={ANDROID_APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-6 py-4 font-semibold text-white shadow-[0_10px_30px_rgba(11,31,77,0.28)] transition hover:shadow-[0_14px_36px_rgba(11,31,77,0.38)]"
            >
              <span aria-hidden className="text-xl">🤖</span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
                  Télécharger pour
                </span>
                <span className="text-base">Android (.apk)</span>
              </span>
            </a>

            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-400"
              title="Bientôt disponible"
            >
              <span aria-hidden className="text-xl">🍎</span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Bientôt sur
                </span>
                <span className="text-base">App Store iOS</span>
              </span>
            </button>
          </div>

          <p className="mt-4 max-w-md text-xs leading-5 text-slate-500">
            ⚠️ Lors de l&apos;installation, Android peut vous demander d&apos;autoriser
            l&apos;installation depuis cette source — c&apos;est normal pour les apps hors Play
            Store. Acceptez pour continuer.
          </p>

          <ul className="mt-9 space-y-4">
            <FeatureRow
              icon="🛫"
              title="Trajets vérifiés"
              desc="Trouvez en quelques secondes un voyageur sur votre destination."
            />
            <FeatureRow
              icon="💳"
              title="Paiement sécurisé Stripe"
              desc="Vous payez seulement quand le voyageur accepte votre demande."
            />
            <FeatureRow
              icon="💬"
              title="Messagerie en direct"
              desc="Chat intégré avec notifications, sans échanger vos numéros."
            />
            <FeatureRow
              icon="🎁"
              title="Parrainage -5 %"
              desc="Invitez vos proches, vous gagnez tous les deux -5 % sur votre prochain envoi."
            />
          </ul>
        </section>

        {/* Colonne droite : mockup style téléphone */}
        <aside className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-900 bg-gradient-to-br from-[#0b1f4d] via-[#1e3a8a] to-[#10b981] p-3 shadow-[0_30px_70px_rgba(11,31,77,0.32)]">
            {/* Notch */}
            <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900" />

            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-[#eef5ff] p-5 text-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                KiloLink
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
                Bonjour 👋
              </h2>
              <p className="mt-1 text-sm text-slate-600">Trouvez votre voyageur</p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Trajet populaire
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  Bruxelles <span className="text-emerald-600">→</span> Abidjan
                </p>
                <p className="mt-1 text-xs text-slate-500">3 juin · 12 kg dispo · 8 €/kg</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  ✓ Vérifié
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#0b1f4d] to-[#1d3f8f] p-4 text-white shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  🎁 Parrainage
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug">
                  Invitez un ami, gagnez -5 %
                </p>
              </div>

              <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Aperçu de l&apos;app
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bandeau bas — comment installer */}
      <section className="relative mt-16 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.06)] md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Comment installer
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
          3 étapes, moins d&apos;une minute
        </h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          <li className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f4d] font-bold text-white">
              1
            </span>
            <p className="mt-3 font-semibold text-slate-900">Cliquez sur Télécharger</p>
            <p className="mt-1 text-sm text-slate-600">
              Le fichier <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">.apk</code>{" "}
              de l&apos;app commence à se télécharger.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f4d] font-bold text-white">
              2
            </span>
            <p className="mt-3 font-semibold text-slate-900">Ouvrez le fichier</p>
            <p className="mt-1 text-sm text-slate-600">
              Si Android demande l&apos;autorisation, acceptez « Autoriser cette source ».
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f4d] font-bold text-white">
              3
            </span>
            <p className="mt-3 font-semibold text-slate-900">Lancez KiloLink</p>
            <p className="mt-1 text-sm text-slate-600">
              L&apos;icône apparaît sur votre écran d&apos;accueil. Connectez-vous avec votre compte
              kilolink.be.
            </p>
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
          <p className="text-emerald-800">
            <span className="font-semibold">Un souci ?</span> Écrivez-nous, on vous aide en moins
            d&apos;une heure.
          </p>
          <Link
            href="/contact"
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
          >
            Nous contacter
          </Link>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-slate-400">
        Le compte utilisé sur l&apos;app est le même que sur kilolink.be — vous retrouvez vos
        trajets, réservations et messages automatiquement.
      </p>
    </main>
  );
}
