"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BookingActionStatus = "accepted" | "rejected" | "cancelled" | "completed";

export async function updateBookingStatus(bookingId: string, nextStatus: BookingActionStatus) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "Supabase non configure" };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifie" };
  }

  const { data: booking, error: loadErr } = await supabase
    .from("bookings")
    .select("id, status, sender_id, trip_id, trips!inner(traveler_id)")
    .eq("id", bookingId)
    .single();

  if (loadErr || !booking) {
    return { error: loadErr?.message ?? "Reservation introuvable" };
  }

  const tripRow = booking.trips as { traveler_id: string } | { traveler_id: string }[] | null;
  const travelerId = Array.isArray(tripRow) ? tripRow[0]?.traveler_id : tripRow?.traveler_id;
  if (!travelerId) {
    return { error: "Trajet introuvable" };
  }
  const isTraveler = travelerId === user.id;
  const isSender = booking.sender_id === user.id;

  const cur = booking.status as string;

  if (nextStatus === "accepted" || nextStatus === "rejected") {
    if (!isTraveler) {
      return { error: "Seul le voyageur peut accepter ou refuser." };
    }
    if (cur !== "pending") {
      return { error: "Cette reservation n'est plus modifiable." };
    }
  }

  if (nextStatus === "cancelled") {
    if (!isSender) {
      return { error: "Seul l'expediteur peut annuler une demande en attente." };
    }
    if (cur !== "pending") {
      return { error: "Annulation impossible a ce stade." };
    }
  }

  if (nextStatus === "completed") {
    if (!isTraveler && !isSender) {
      return { error: "Acces refuse." };
    }
    if (cur !== "accepted") {
      return { error: "La reservation doit etre acceptee avant cloture." };
    }
  }

  const { error } = await supabase.from("bookings").update({ status: nextStatus }).eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/messages");
  return { ok: true };
}

export async function submitReviewAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "Supabase non configure" };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const bookingId = String(formData.get("bookingId") ?? "");
  const reviewedUserId = String(formData.get("reviewedUserId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "");

  if (!bookingId || !reviewedUserId || rating < 1 || rating > 5) {
    return { error: "Donnees d'avis invalides." };
  }

  const { data: booking, error: loadErr } = await supabase
    .from("bookings")
    .select("id, status, sender_id, trip_id, trips!inner(traveler_id)")
    .eq("id", bookingId)
    .single();

  if (loadErr || !booking || booking.status !== "completed") {
    return { error: "Avis possible uniquement apres une reservation terminee." };
  }

  const tripRow = booking.trips as { traveler_id: string } | { traveler_id: string }[] | null;
  const travelerId = Array.isArray(tripRow) ? tripRow[0]?.traveler_id : tripRow?.traveler_id;
  if (!travelerId) {
    return { error: "Trajet introuvable" };
  }
  const isTraveler = travelerId === user.id;
  const isSender = booking.sender_id === user.id;
  if (!isTraveler && !isSender) {
    return { error: "Acces refuse." };
  }
  if (reviewedUserId !== travelerId && reviewedUserId !== booking.sender_id) {
    return { error: "Destinataire de l'avis invalide." };
  }
  if (reviewedUserId === user.id) {
    return { error: "Vous ne pouvez pas vous noter vous-meme." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    reviewer_id: user.id,
    reviewed_user_id: reviewedUserId,
    rating,
    comment: comment || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}

export async function bookingStatusFormAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as BookingActionStatus;
  if (!bookingId || !nextStatus) {
    redirect("/dashboard?error=action_invalide");
  }
  const r = await updateBookingStatus(bookingId, nextStatus);
  if (r.error) {
    redirect(`/booking/${bookingId}?error=${encodeURIComponent(r.error)}`);
  }
  redirect(`/booking/${bookingId}`);
}

export async function reviewFormAction(formData: FormData) {
  const r = await submitReviewAction(formData);
  const bookingId = String(formData.get("bookingId") ?? "");
  if (r.error) {
    redirect(`/booking/${bookingId}?error=${encodeURIComponent(r.error)}`);
  }
  redirect(`/booking/${bookingId}`);
}
