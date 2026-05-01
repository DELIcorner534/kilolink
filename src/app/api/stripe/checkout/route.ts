import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const { bookingId } = (await request.json()) as { bookingId?: string };

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 503 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, sender_id, kilos_requested, status, trips!inner(price_per_kg, traveler_id)")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    }

    if (booking.sender_id !== user.id) {
      return NextResponse.json({ error: "Seul l expediteur peut payer" }, { status: 403 });
    }

    if (booking.status !== "accepted") {
      return NextResponse.json({ error: "La reservation doit etre acceptee avant paiement" }, { status: 400 });
    }

    const tripRaw = booking.trips as { price_per_kg: number; traveler_id: string } | { price_per_kg: number; traveler_id: string }[];
    const trip = Array.isArray(tripRaw) ? tripRaw[0] : tripRaw;
    if (!trip) {
      return NextResponse.json({ error: "Trajet introuvable" }, { status: 404 });
    }
    const amount = round2(Number(booking.kilos_requested) * Number(trip.price_per_kg));
    if (amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const commission = round2(amount * 0.1);

    const { data: paid } = await supabase
      .from("payments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("status", "paid")
      .maybeSingle();

    if (paid) {
      return NextResponse.json({ error: "Deja paye" }, { status: 400 });
    }

    const { data: pending } = await supabase
      .from("payments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("status", "pending")
      .maybeSingle();

    let paymentId: string;
    if (pending?.id) {
      const { error: updErr } = await supabase
        .from("payments")
        .update({ amount, commission })
        .eq("id", pending.id);
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      paymentId = pending.id;
    } else {
      const { data: inserted, error: payInsErr } = await supabase
        .from("payments")
        .insert({
          booking_id: bookingId,
          amount,
          commission,
          currency: "EUR",
          status: "pending",
        })
        .select("id")
        .single();

      if (payInsErr || !inserted) {
        return NextResponse.json({ error: payInsErr?.message ?? "Insertion paiement impossible" }, { status: 500 });
      }
      paymentId = inserted.id;
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/booking/${bookingId}?payment=success`,
      cancel_url: `${baseUrl}/booking/${bookingId}?payment=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Reservation KiloLink",
              description: `Reservation #${bookingId}`,
            },
          },
        },
      ],
      metadata: {
        paymentId,
        bookingId,
      },
    });

    if (session.id) {
      await supabase.from("payments").update({ stripe_checkout_session_id: session.id }).eq("id", paymentId);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Creation checkout impossible", details: String(error) }, { status: 500 });
  }
}
