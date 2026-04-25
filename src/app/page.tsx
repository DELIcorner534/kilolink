import Link from "next/link";
import { trips, reviews, supportedCities, supportedCountries } from "@/lib/data";
import { CountryFlag } from "@/components/country-flag";
import { TripCard } from "@/components/trip-card";

export default function Home() {
  const belgium = supportedCountries.find((country) => country.name === "Belgique");
  const partnerCountries = supportedCountries.filter((country) => country.name !== "Belgique");
  const trustStats = [
    { label: "Trajets actifs / semaine", value: "1 200+" },
    { label: "Membres verifies", value: "95%" },
    { label: "Paiements securises", value: "100%" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-8 md:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-blue-200/40 bg-gradient-to-b from-[#eaf2ff] to-white p-6 shadow-[0_20px_60px_rgba(11,31,77,0.09)] md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-2xl" />

        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Belgique - Afrique</p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Covoiturage colis fiable, simple et professionnel
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600 md:text-lg">
            Trouvez un voyageur, reservez vos kilos, payez en securite et discutez en direct, sur une plateforme inspiree
            des meilleurs standards du marche.
          </p>
        </div>

        <form
          action="/search"
          method="get"
          className="relative z-10 mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] md:grid-cols-12 md:items-center"
        >
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Depart</label>
            <select
              name="origin"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white"
              defaultValue="Bruxelles"
            >
              {supportedCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Destination</label>
            <select
              name="destination"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white"
              defaultValue=""
            >
              <option value="">Choisir une ville de destination</option>
              {supportedCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</label>
            <input
              name="date"
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-transparent">Action</label>
            <button className="w-full rounded-xl bg-[#0b1f4d] p-3 font-semibold !text-white transition hover:brightness-110">
              Rechercher un trajet
            </button>
          </div>
        </form>

        <div className="relative z-10 mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 md:text-sm">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">Paiement securise Stripe</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">Profils verifies</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">Messagerie instantanee</span>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full bg-[#0b1f4d] px-6 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20 transition hover:brightness-110"
          >
            <span className="!text-white">Voir les trajets</span>
          </Link>
          <Link
            href="/publish-trip"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Publier un trajet
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {trustStats.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <p className="text-2xl font-bold text-[#0b1f4d]">{item.value}</p>
            <p className="mt-1 text-sm text-slate-600">{item.label}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Trajets populaires</h2>
            <p className="mt-1 text-sm text-slate-600">Des voyageurs actifs chaque semaine sur les corridors principaux.</p>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[#0b1f4d] hover:underline">
            Voir tous les trajets
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Corridors disponibles</h2>
        <p className="mt-2 text-slate-600">Réseau actif de trajets réguliers entre la Belgique et vos destinations clés.</p>
        <div className="corridor-stage mt-6">
          <div className="corridor-hub">
            <CountryFlag code={belgium?.code ?? "be"} name="Belgique" />
            <span>Belgique</span>
          </div>
          <div className="corridor-list">
            {partnerCountries.map((country, index) => (
              <article
                key={country.name}
                className="corridor-route"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <div className="corridor-line" />
                <div className="corridor-card">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                    <CountryFlag code={country.code} name={country.name} />
                    {country.name}
                  </span>
                  <span className="corridor-badge">⇄</span>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {supportedCountries.map((country) => (
            <span
              key={country.name}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              <CountryFlag code={country.code} name={country.name} />
              {country.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Avis clients</h2>
            <p className="mt-1 text-sm text-slate-600">Des retours vérifiés de la communauté KiloLink.</p>
          </div>
          <Link href="/faq" className="text-sm font-semibold text-[#0b1f4d] hover:underline">
            Voir la FAQ
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
            >
              <p className="mb-2 text-emerald-600">{"★".repeat(review.rating)}</p>
              <p className="text-slate-700">{review.comment}</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{review.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] p-8 text-white shadow-[0_16px_36px_rgba(11,31,77,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Commencer en 2 minutes</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Tu veux envoyer ou transporter un colis ?</h2>
        <p className="mt-2 max-w-2xl text-blue-100">
          Cree ton compte gratuitement, publie ou reserve un trajet et suis tout depuis ton tableau de bord.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/sign-up"
            className="inline-flex min-w-56 items-center justify-center rounded-full border border-white/80 bg-white px-6 py-3 font-semibold !text-[#0b1f4d] shadow-sm"
          >
            <span className="!text-[#0b1f4d]">Creer un compte</span>
          </Link>
          <Link href="/publish-trip" className="rounded-full border border-white/40 px-6 py-3 font-semibold !text-white">
            Publier mon trajet
          </Link>
        </div>
      </section>
    </main>
  );
}
