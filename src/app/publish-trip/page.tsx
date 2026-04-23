import { DashboardShell } from "@/components/dashboard-shell";
import { CountryFlag } from "@/components/country-flag";
import { EnvWarning } from "@/components/env-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { supportedCountries } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function createTripAction(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/publish-trip?error=Configuration+Supabase+manquante");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { error } = await supabase.from("trips").insert({
    traveler_id: user.id,
    origin: String(formData.get("origin") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    departure_date: String(formData.get("departureDate") ?? ""),
    airline: String(formData.get("airline") ?? ""),
    kilos_available: Number(formData.get("kilosAvailable") ?? 0),
    price_per_kg: Number(formData.get("pricePerKg") ?? 0),
    accepted_items: String(formData.get("acceptedItems") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (error) {
    redirect(`/publish-trip?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?success=trip");
}

export default async function PublishTripPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  return (
    <DashboardShell title="Publier un trajet">
      {!supabase ? (
        <EnvWarning title="Supabase non configure" />
      ) : (
        <>
        <div className="mb-4 flex flex-wrap gap-2">
          {supportedCountries.map((country) => (
            <span
              key={country.name}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              <CountryFlag code={country.code} name={country.name} size={16} />
              {country.name}
            </span>
          ))}
        </div>
        <form action={createTripAction} className="grid gap-4 md:grid-cols-2">
        <select name="origin" className="rounded-xl border border-slate-200 p-3" required defaultValue="">
          <option value="" disabled>
            Pays de depart
          </option>
          {supportedCountries.map((country) => (
            <option key={country.name} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
        <select name="destination" className="rounded-xl border border-slate-200 p-3" required defaultValue="">
          <option value="" disabled>
            Pays de destination
          </option>
          {supportedCountries.map((country) => (
            <option key={country.name} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
        <input
          name="departureDate"
          type="date"
          className="rounded-xl border border-slate-200 p-3"
          placeholder="Date de depart"
          required
        />
        <input name="airline" className="rounded-xl border border-slate-200 p-3" placeholder="Compagnie aerienne" />
        <input
          name="kilosAvailable"
          type="number"
          min={1}
          className="rounded-xl border border-slate-200 p-3"
          placeholder="Kilos disponibles"
          required
        />
        <input
          name="pricePerKg"
          type="number"
          min={1}
          className="rounded-xl border border-slate-200 p-3"
          placeholder="Prix par kilo"
          required
        />
        <input
          name="acceptedItems"
          className="rounded-xl border border-slate-200 p-3 md:col-span-2"
          placeholder="Objets acceptes"
        />
        <textarea
          name="description"
          className="h-28 rounded-xl border border-slate-200 p-3 md:col-span-2"
          placeholder="Description"
        />
        <FormSubmitButton
          idleLabel="Publier mon trajet"
          loadingLabel="Publication..."
          className="rounded-xl bg-[#0b1f4d] px-5 py-3 font-semibold !text-white md:col-span-2"
        />
        {params.error ? <p className="text-sm text-red-600 md:col-span-2">{params.error}</p> : null}
        </form>
        </>
      )}
    </DashboardShell>
  );
}
