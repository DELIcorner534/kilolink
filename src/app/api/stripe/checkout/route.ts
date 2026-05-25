import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// CORS — allow the mobile app (running on Expo web at localhost:8081, on
// LAN-IP for device testing, or any origin in dev) to hit this endpoint.
// In production this should be tightened to the actual mobile app origins.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function withCors<T extends NextResponse>(res: T): T {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Authenticate the request either via Supabase cookies (web) or via a
 * `Authorization: Bearer <access_token>` header (mobile app).
 *
 * Returns the authenticated user + a supabase client to use for the rest of
 * the request, or `null` if auth fails.
 */
async function authenticate(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { data } = await client.auth.getUser(token);
    if (!data?.user) return null;
    return { user: data.user, supabase: client };
  }

  const cookieClient = await createSupabaseServerClient();
  if (!cookieClient) return null;
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return null;
  return { user, supabase: cookieClient };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      bookingId?: string;
      source?: "web" | "mobile";
    };
    const { bookingId, source } = body;

    if (!bookingId) {
      return json({ error: "Identifiant de réservation requis" }, { status: 400 });
    }

    const auth = await authenticate(request);
    if (!auth) {
      return json({ error: "Non authentifié" }, { status: 401 });
    }
    const { user, supabase } = auth;

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select(
        "id, sender_id, kilos_requested, status, discount_percent, trips!inner(price_per_kg, traveler_id)",
      )
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.sender_id !== user.id) {
      return json({ error: "Seul l'expéditeur peut payer" }, { status: 403 });
    }

    if (booking.status !== "accepted") {
      return json(
        { error: "La réservation doit être acceptée avant paiement" },
        { status: 400 },
      );
    }

    const tripRaw = booking.trips as
      | { price_per_kg: number; traveler_id: string }
      | { price_per_kg: number; traveler_id: string }[];
    const trip = Array.isArray(tripRaw) ? tripRaw[0] : tripRaw;
    if (!trip) {
      return json({ error: "Trajet introuvable" }, { status: 404 });
    }
    const grossAmount = round2(Number(booking.kilos_requested) * Number(trip.price_per_kg));
    if (grossAmount <= 0) {
      return json({ error: "Montant invalide" }, { status: 400 });
    }

    // Application éventuelle de la remise de parrainage (-5 % par défaut).
    const discountPercent = Math.max(0, Math.min(100, Number(booking.discount_percent) || 0));
    const discountAmount = round2((grossAmount * discountPercent) / 100);
    const amount = round2(grossAmount - discountAmount);
    const commission = round2(amount * 0.1);

    const { data: paid } = await supabase
      .from("payments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("status", "paid")
      .maybeSingle();

    if (paid) {
      return json({ error: "Déjà payé" }, { status: 400 });
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
        return json({ error: updErr.message }, { status: 500 });
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
        return json(
          { error: payInsErr?.message ?? "Insertion paiement impossible" },
          { status: 500 },
        );
      }
      paymentId = inserted.id;
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const isMobile = source === "mobile";

    // Mobile : we redirect Stripe back into the app via deep link. The web app
    // also hosts a tiny bouncer page at /pay/return that re-emits the deep link
    // for browsers that strip custom schemes from Stripe redirects.
    const successUrl = isMobile
      ? `${baseUrl}/pay/return?status=success&bookingId=${bookingId}`
      : `${baseUrl}/booking/${bookingId}?payment=success`;
    const cancelUrl = isMobile
      ? `${baseUrl}/pay/return?status=cancel&bookingId=${bookingId}`
      : `${baseUrl}/booking/${bookingId}?payment=cancel`;

    const productDescription =
      discountPercent > 0
        ? `Réservation n°${bookingId} · -${discountPercent} % parrainage (–${discountAmount.toFixed(2)} €)`
        : `Réservation n°${bookingId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Réservation KiloLink",
              description: productDescription,
            },
          },
        },
      ],
      metadata: {
        paymentId,
        bookingId,
        source: source ?? "web",
        discountPercent: String(discountPercent),
        discountAmount: discountAmount.toFixed(2),
        grossAmount: grossAmount.toFixed(2),
      },
    });

    if (session.id) {
      await supabase
        .from("payments")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", paymentId);
    }

    return json({
      url: session.url,
      amount,
      commission,
      discountPercent,
      discountAmount,
      grossAmount,
    });
  } catch (error) {
    return json(
      { error: "Création du paiement impossible", details: String(error) },
      { status: 500 },
    );
  }
}
