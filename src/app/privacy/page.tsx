export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Politique de confidentialite</h1>
        <p className="mt-2 text-slate-600">Comment nous collectons, protegeons et utilisons vos donnees.</p>
        <div className="mt-6 space-y-3 text-slate-700">
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            KiloLink respecte le RGPD et collecte uniquement les donnees necessaires au service.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Les donnees de paiement sont traitees par Stripe et ne sont pas stockees en clair.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Chaque utilisateur peut demander suppression ou export de ses donnees personnelles.
          </p>
        </div>
      </section>
    </main>
  );
}
