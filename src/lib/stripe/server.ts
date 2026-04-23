import Stripe from "stripe";

export function getStripeClient() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }

  return new Stripe(stripeSecret, {
    apiVersion: "2026-03-25.dahlia",
  });
}
