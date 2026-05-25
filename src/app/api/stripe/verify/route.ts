import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function withCors<T extends NextResponse>(res: T): T {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}
function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * Authenticate via Bearer access token only (mobile-only endpoint).
 */
async function authenticate(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const h = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!h || !h.toLowerCase().startsWith("bearer ")) return null;
  const token = h.slice(7).trim();
  if (!token) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data } = await client.auth.getUser(token);
  if (!data?.user) return null;
  return data.user;
}

/**
 * Verifies that the latest Stripe Checkout session for a given booking has been
 * paid, and updates the payment row accordingly. Use this from the mobile app
 * after returning from the in-app browser — it makes payment confirmation
 * resilient to webhook delays or outages.
 *
 * Body : { bookingId: string }
 * Returns : { paid: boolean, amount?: number, currency?: string }
 */
export async function POST(request: Request) {
  try {
    const { bookingId } = (await request.json().catch(() => ({}))) as { bookingId?: string };
    if (!bookingId) {
      return json({ error: "bookingId requis" }, { status: 400 });
    }

    const user = await authenticate(request);
    if (!user) {
      return json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return json({ error: "Service role Supabase manquant" }, { status: 503 });
    }

    // Make sure the user is allowed to see this booking (sender only, since
    // only the sender pays).
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, sender_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (bErr || !booking) {
      return json({ error: "Réservation introuvable" }, { status: 404 });
    }
    if (booking.sender_id !== user.id) {
      return json({ error: "Accès refusé" }, { status: 403 });
    }

    // Latest payment row for this booking
    const { data: payment } = await admin
      .from("payments")
      .select("id, status, amount, currency, stripe_checkout_session_id")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) {
      return json({ paid: false, reason: "Aucun paiement initié" });
    }
    if (payment.status === "paid") {
      return json({
        paid: true,
        amount: payment.amount,
        currency: payment.currency,
        source: "db",
      });
    }
    if (!payment.stripe_checkout_session_id) {
      return json({ paid: false, reason: "Session Stripe absente" });
    }

    // Fetch session from Stripe to check payment_status authoritatively.
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);

    if (session.payment_status === "paid") {
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await admin
        .from("payments")
        .update({
          status: "paid",
          stripe_payment_intent_id: pi,
        })
        .eq("id", payment.id);

      return json({
        paid: true,
        amount: payment.amount,
        currency: payment.currency,
        source: "stripe",
      });
    }

    return json({
      paid: false,
      reason: `Stripe payment_status=${session.payment_status}`,
    });
  } catch (e) {
    return json(
      { error: "Vérification impossible", details: String(e) },
      { status: 500 },
    );
  }
}
