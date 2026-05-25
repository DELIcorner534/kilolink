import { DashboardShell } from "@/components/dashboard-shell";
import { EnvWarning } from "@/components/env-warning";
import { FormSubmitButton } from "@/components/form-submit-button";
import { isProfileAdmin } from "@/lib/profile-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function createBookingAction(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/booking/new?error=Configuration+Supabase+manquante");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const tripId = String(formData.get("tripId") ?? "");
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      trip_id: tripId,
      sender_id: user.id,
      kilos_requested: Number(formData.get("kilosRequested") ?? 0),
      parcel_description: String(formData.get("parcelDescription") ?? ""),
      parcel_photo_url: String(formData.get("parcelPhotoUrl") ?? ""),
      parcel_value: Number(formData.get("parcelValue") ?? 0),
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/booking/new?error=${encodeURIComponent(error.message)}`);
  }

  // Si l'utilisateur a une récompense de parrainage disponible, on l'applique
  // automatiquement à cette réservation (la RPC est idempotente côté DB).
  try {
    await supabase.rpc("apply_reward_to_booking", { p_booking_id: data.id });
  } catch {
    // Non-bloquant : on garde la réservation au tarif standard si la RPC échoue.
  }

  redirect(`/booking/${data.id}?new=1`);
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tripId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  let showAdminLink = false;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      showAdminLink = await isProfileAdmin(supabase, user.id);
    }
  }

  return (
    <DashboardShell title="Réserver un espace bagage" showAdminLink={showAdminLink}>
      {!supabase ? <EnvWarning title="Supabase non configuré" /> : null}
      {supabase ? (
        <form action={createBookingAction} className="space-y-4">
          {params.tripId ? (
            <>
              <input type="hidden" name="tripId" value={params.tripId} />
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Trajet sélectionné automatiquement. Vous pouvez confirmer votre demande ci-dessous.
              </div>
            </>
          ) : (
            <input
              name="tripId"
              className="w-full rounded-xl border border-slate-200 p-3"
              placeholder="ID trajet"
              defaultValue=""
              required
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="kilosRequested"
              type="number"
              min={1}
              className="w-full rounded-xl border border-slate-200 p-3"
              placeholder="Kilos demandés"
              required
            />
            <input
              name="parcelValue"
              type="number"
              min={0}
              className="w-full rounded-xl border border-slate-200 p-3"
              placeholder="Valeur du colis (€)"
            />
          </div>
          <textarea
            name="parcelDescription"
            className="h-24 w-full rounded-xl border border-slate-200 p-3"
            placeholder="Description colis"
            required
          />
          <input
            name="parcelPhotoUrl"
            className="w-full rounded-xl border border-slate-200 p-3"
            placeholder="Lien photo colis (optionnel)"
          />
          <FormSubmitButton
            idleLabel="Confirmer la réservation"
            loadingLabel="Confirmation..."
            className="rounded-xl bg-[#0b1f4d] px-5 py-3 font-semibold !text-white"
          />
          {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
        </form>
      ) : null}
    </DashboardShell>
  );
}
