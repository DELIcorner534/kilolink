export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Politique de confidentialité</h1>
        <p className="mt-2 text-slate-600">Comment nous collectons, protégeons et utilisons vos données.</p>
        <div className="mt-6 space-y-3 text-slate-700">
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            KiloLink respecte le RGPD et collecte uniquement les données nécessaires au service.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Les données de paiement sont traitées par Stripe et ne sont pas stockées en clair.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Chaque utilisateur peut demander la suppression ou l&apos;export de ses données personnelles.
          </p>
        </div>
      </section>
    </main>
  );
}
