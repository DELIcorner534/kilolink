import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold text-[#0b1f4d]">KiloLink</p>
          <p className="mt-2 max-w-xs">
            Plateforme de mise en relation entre voyageurs et expéditeurs, avec un parcours simple et sécurisé.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Plateforme</p>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/search">Recherche voyageurs</Link>
            </li>
            <li>
              <Link href="/publish-trip">Publier un trajet</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Juridique</p>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/terms">Conditions générales</Link>
            </li>
            <li>
              <Link href="/privacy">Politique de confidentialité</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Assistance</p>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-slate-500">
          © {new Date().getFullYear()} KiloLink. Tous droits réservés. Plateforme inspirée des meilleurs standards UX du transport collaboratif.
        </p>
      </div>
    </footer>
  );
}
