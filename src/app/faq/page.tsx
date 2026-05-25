import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPublishedFaqItems } from "@/lib/content";

export default async function FaqPage() {
  const supabase = await createSupabaseServerClient();
  const faqItems = supabase ? await fetchPublishedFaqItems(supabase) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <h1 className="font-display text-3xl font-semibold text-slate-900">FAQ</h1>
      <p className="mt-2 text-slate-600">Questions fréquentes sur les trajets, réservations et paiements.</p>
      <div className="mt-6 space-y-4">
        {faqItems.length ? (
          faqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <h2 className="font-semibold text-slate-900">{item.question}</h2>
              <p className="mt-2 text-slate-600">{item.answer}</p>
            </article>
          ))
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-slate-600">
            Aucune FAQ publiée pour le moment. Vous pouvez nous contacter via la page{" "}
            <Link href="/contact" className="font-semibold text-[#0b1f4d] hover:underline">
              Contact
            </Link>
            .
          </article>
        )}
      </div>
      </section>
    </main>
  );
}
