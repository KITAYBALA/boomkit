export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  tokens?: number
  bonus?: string
  type: "tokens" | "subscription"
  features?: string[]
  variantId?: string
}

// Token packages and subscriptions for Boomkit
export const PRODUCTS: Product[] = [
  {
    id: "starter-tokens",
    name: "Starter Pack",
    description: "500 Tokens to get you started",
    priceInCents: 168, // 1.68 AZN (0.99 * 1.70)
    tokens: 500,
    type: "tokens",
    variantId: process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID || "",
  },
  {
    id: "popular-tokens",
    name: "Popular Pack",
    description: "1,500 Tokens + 10% bonus",
    priceInCents: 848, // 8.48 AZN (4.99 * 1.70)
    tokens: 1650,
    bonus: "+150 bonus",
    type: "tokens",
    variantId: process.env.LEMON_SQUEEZY_POPULAR_VARIANT_ID || "",
  },
  {
    id: "mega-tokens",
    name: "Mega Pack",
    description: "5,000 Tokens + 20% bonus",
    priceInCents: 1698, // 16.98 AZN (9.99 * 1.70)
    tokens: 6000,
    bonus: "+1000 bonus",
    type: "tokens",
    variantId: process.env.LEMON_SQUEEZY_MEGA_VARIANT_ID || "",
  },
  {
    id: "ultimate-tokens",
    name: "Ultimate Pack",
    description: "15,000 Tokens + 30% bonus",
    priceInCents: 4248, // 42.48 AZN (24.99 * 1.70)
    tokens: 19500,
    bonus: "+4500 bonus",
    type: "tokens",
    variantId: process.env.LEMON_SQUEEZY_ULTIMATE_VARIANT_ID || "",
  },
  {
    id: "boomkit-plus",
    name: "Boomkit Plus",
    description: "Unlock premium features",
    priceInCents: 848, // 8.48 AZN (4.99 * 1.70)
    type: "subscription",
    features: ["Custom Banners", "Plus Role Badge", "Custom Name Colors"],
    variantId: process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID || "",
  },
]
