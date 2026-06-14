"use server"

import { PRODUCTS } from "@/lib/products"
import { supabaseServerClient } from "@/lib/supabase-server-client"

export async function createLemonCheckout(productId: string, userId: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const variantId = product.variantId
  if (!variantId) {
    throw new Error(`Variant ID for product "${productId}" is not configured`)
  }

  const storeId = process.env.LEMON_SQUEEZY_STORE_ID
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY

  if (!storeId || !apiKey) {
    throw new Error("Lemon Squeezy configuration keys are missing on the server")
  }

  const supabase = supabaseServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("email, username")
    .eq("id", userId)
    .single()

  const userEmail = user?.email || ""
  const username = user?.username || ""

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: "https://boomkit.org",
          },
          checkout_data: {
            email: userEmail,
            custom: {
              userId,
              productId,
              tokens: String(product.tokens ?? 0),
              username,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Lemon Squeezy API Error response:", errorText)
    throw new Error(`Lemon Squeezy checkout creation failed: ${response.statusText}`)
  }

  const resJson = await response.json()
  const checkoutUrl = resJson?.data?.attributes?.url

  if (!checkoutUrl) {
    throw new Error("Lemon Squeezy did not return a checkout URL")
  }

  return checkoutUrl
}
