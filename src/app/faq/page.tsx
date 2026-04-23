import { faqItems } from "@/lib/data";

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <h1 className="font-display text-3xl font-semibold text-slate-900">FAQ</h1>
      <p className="mt-2 text-slate-600">Questions frequentes sur les trajets, reservations et paiements.</p>
      <div className="mt-6 space-y-4">
        {faqItems.map((item) => (
          <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="font-semibold text-slate-900">{item.question}</h2>
            <p className="mt-2 text-slate-600">{item.answer}</p>
          </article>
        ))}
      </div>
      </section>
    </main>
  );
}
