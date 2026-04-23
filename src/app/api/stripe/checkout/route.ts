import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { bookingId, amountInEur } = (await request.json()) as {
      bookingId: string;
      amountInEur: number;
    };

    if (!bookingId || !amountInEur) {
      return NextResponse.json({ error: "bookingId et amountInEur sont requis" }, { status: 400 });
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

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/booking/new?payment=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amountInEur * 100),
            product_data: {
              name: "Reservation KiloLink",
              description: `Reservation #${bookingId}`,
            },
          },
        },
      ],
      metadata: {
        bookingId,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Creation checkout impossible", details: String(error) }, { status: 500 });
  }
}
