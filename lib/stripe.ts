import "server-only"

import Stripe from "stripe"

const stripeKey = process.env.STRIPE_SECRET_KEY || (() => {
  console.warn("WARNING: STRIPE_SECRET_KEY is not defined in the environment. Falling back to a dummy key.")
  return "sk_test_51placeholder_stripe_key_remediated"
})()

export const stripe = new Stripe(stripeKey)
