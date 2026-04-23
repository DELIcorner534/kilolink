export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Contact</h1>
        <p className="mt-2 text-slate-600">Besoin d&apos;assistance ou d&apos;un partenariat ? Reponse sous 24h.</p>
        <form className="mt-6 space-y-4" action="mailto:support@kilolink.app" method="post" encType="text/plain">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
            placeholder="Nom complet"
            name="fullName"
            required
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
            placeholder="Email"
            name="email"
            type="email"
            required
          />
          <textarea
            className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 outline-none ring-[#0b1f4d]/20 transition focus:ring-4"
            placeholder="Message"
            name="message"
            required
          />
          <button className="rounded-xl bg-gradient-to-r from-[#0b1f4d] to-[#1d3f8f] px-5 py-3 font-semibold !text-white shadow-lg shadow-blue-900/20">
            Envoyer
          </button>
        </form>
      </section>
    </main>
  );
}
