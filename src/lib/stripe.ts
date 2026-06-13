import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is missing. Stripe payments will fail.");
}

export const stripe = new Stripe(stripeSecretKey || "placeholder-secret-key", {
  // Let the SDK use your account's default API version
  typescript: true,
});
export default stripe;
