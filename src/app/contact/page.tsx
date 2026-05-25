import { redirect } from "next/navigation";

async function sendContactAction(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !email || !message) {
    redirect(`/contact?error=${encodeURIComponent("Merci de remplir tous les champs.")}`);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || "support@kilolink.app";
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  if (!resendApiKey) {
    redirect(`/contact?error=${encodeURIComponent("Service e-mail indisponible. Réessayez plus tard.")}`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Nouveau message contact - ${fullName}`,
      text: `Nom: ${fullName}\nEmail: ${email}\n\nMessage:\n${message}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    redirect(`/contact?error=${encodeURIComponent("Impossible d'envoyer le message pour le moment.")}`);
  }

  redirect("/contact?success=1");
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Contact</h1>
        <p className="mt-2 text-slate-600">Besoin d&apos;assistance ou d&apos;un partenariat ? Réponse sous 24 h.</p>
        {params.success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Message envoyé avec succès. Nous vous répondrons rapidement.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p>
        ) : null}
        <form className="mt-6 space-y-4" action={sendContactAction}>
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
