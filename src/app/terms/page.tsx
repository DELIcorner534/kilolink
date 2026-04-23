export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Conditions generales d&apos;utilisation</h1>
        <p className="mt-2 text-slate-600">Regles essentielles pour une experience sure et transparente.</p>
        <div className="mt-6 space-y-3 text-slate-700">
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Les utilisateurs sont responsables des colis declares et de la conformite reglementaire.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            KiloLink agit comme intermediaire de mise en relation entre expediteurs et voyageurs.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Les transactions sont securisees et soumises aux frais de service de la plateforme.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            Tout comportement frauduleux entraine suspension immediate du compte.
          </p>
        </div>
      </section>
    </main>
  );
}
