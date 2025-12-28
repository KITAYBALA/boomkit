export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  tokens?: number
  bonus?: string
  type: "tokens" | "subscription"
  features?: string[]
}

// Token packages and subscriptions for Boomkit
export const PRODUCTS: Product[] = [
  {
    id: "starter-tokens",
    name: "Starter Pack",
    description: "500 Tokens to get you started",
    priceInCents: 99, // $0.99
    tokens: 500,
    type: "tokens",
  },
  {
    id: "popular-tokens",
    name: "Popular Pack",
    description: "1,500 Tokens + 10% bonus",
    priceInCents: 499, // $4.99
    tokens: 1650,
    bonus: "+150 bonus",
    type: "tokens",
  },
  {
    id: "mega-tokens",
    name: "Mega Pack",
    description: "5,000 Tokens + 20% bonus",
    priceInCents: 999, // $9.99
    tokens: 6000,
    bonus: "+1000 bonus",
    type: "tokens",
  },
  {
    id: "ultimate-tokens",
    name: "Ultimate Pack",
    description: "15,000 Tokens + 30% bonus",
    priceInCents: 2499, // $24.99
    tokens: 19500,
    bonus: "+4500 bonus",
    type: "tokens",
  },
  {
    id: "boomkit-plus",
    name: "Boomkit Plus",
    description: "Unlock premium features",
    priceInCents: 499, // $4.99
    type: "subscription",
    features: ["Custom Banners", "Plus Role Badge", "Custom Name Colors"],
  },
]
