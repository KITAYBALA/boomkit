"use client"

import { useEffect, useState } from "react"
import { createLemonCheckout } from "@/app/actions/lemonsqueezy"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/products"
import { Coins, Sparkles, Crown, Palette, BadgeCheck } from "lucide-react"
import { toast } from "sonner"

interface LemonCheckoutProps {
  userId: string
  isStaff?: boolean
  onSuccess?: (tokens: number) => void
}

export default function LemonCheckout({ userId, isStaff }: LemonCheckoutProps) {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)

  useEffect(() => {
    // Load Lemon Squeezy script
    const script = document.createElement("script")
    script.src = "https://app.lemonsqueezy.com/js/lemon.js"
    script.async = true
    script.onload = () => {
      if ((window as any).LemonSqueezy) {
        (window as any).LemonSqueezy.Setup({
          eventHandler: (event: any) => {
            console.log("Lemon Squeezy Event:", event)
            if (event.event === "Checkout.Success" || event.event === "Checkout.Close") {
              if (typeof window !== "undefined") {
                (window as any).refreshUserSession?.()
              }
            }
          }
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleSelectProduct = async (productId: string) => {
    setLoadingProductId(productId)
    try {
      const checkoutUrl = await createLemonCheckout(productId, userId)
      
      // Try to open using Lemon Squeezy overlay
      if ((window as any).LemonSqueezy) {
        (window as any).LemonSqueezy.Url.Open(checkoutUrl)
      } else {
        // Fallback: open in new tab
        window.open(checkoutUrl, "_blank")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to initiate checkout")
    } finally {
      setLoadingProductId(null)
    }
  }

  const tokenProducts = PRODUCTS.filter((p) => p.type === "tokens")
  const subscriptionProducts = PRODUCTS.filter((p) => p.type === "subscription")
  const boosterProducts = PRODUCTS.filter((p) => p.type === "booster")

  return (
    <div className="space-y-6">
      {subscriptionProducts.length > 0 && (
        <div className="mb-6">
          <h4 className="font-heading club-ink font-bold text-lg mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 club-accent" />
            Premium Membership
          </h4>
          {subscriptionProducts.map((product) => (
            <div
              key={product.id}
              className="relative club-surface border-2 club-border rounded-xl p-5 club-border transition-all"
            >
              <div className="absolute -top-3 left-4 club-yellow club-ink text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 club-surface rounded-xl flex items-center justify-center">
                  <Crown className="w-8 h-8 club-ink" />
                </div>
                <div>
                  <h3 className="font-bold club-ink text-xl">{product.name}</h3>
                  <p className="font-heading club-accent text-sm">{product.description}</p>
                </div>
              </div>
              {product.features && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {product.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 club-ink text-sm club-well rounded-lg px-3 py-2"
                    >
                      {feature.includes("Banner") && <Palette className="w-4 h-4 club-accent" />}
                      {feature.includes("Role") && <BadgeCheck className="w-4 h-4 club-accent" />}
                      {feature.includes("Color") && <Sparkles className="w-4 h-4 club-accent" />}
                      {feature}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => handleSelectProduct(product.id)}
                disabled={loadingProductId !== null}
                className="club-action w-full club-surface club-ink font-bold text-lg py-3"
              >
                {loadingProductId === product.id ? "Loading..." : `Get Plus - ₼${(product.priceInCents / 100).toFixed(2)} AZN/month`}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Token Products Section */}
      <h4 className="font-heading club-ink font-bold text-lg mb-3 flex items-center gap-2">
        <Coins className="w-5 h-5 club-accent" />
        Token Packs
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tokenProducts.map((product) => (
          <div
            key={product.id}
            className="relative club-purple border club-border rounded-xl p-4 club-border transition-all"
          >
            {product.bonus && (
              <div className="absolute -top-2 -right-2 club-yellow club-ink text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {product.bonus}
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 club-purple rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 club-accent" />
              </div>
              <div>
                <h3 className="font-bold club-ink">{product.name}</h3>
                <p className="font-heading club-accent text-sm">{product.tokens?.toLocaleString()} Tokens</p>
              </div>
            </div>
            <p className="font-heading club-accent text-sm mb-4">{product.description}</p>
            <Button
              onClick={() => handleSelectProduct(product.id)}
              disabled={loadingProductId !== null}
              className="club-action w-full club-purple club-purple club-ink"
            >
              {loadingProductId === product.id ? "Loading..." : `₼${(product.priceInCents / 100).toFixed(2)} AZN`}
            </Button>
          </div>
        ))}
      </div>

      {/* Booster Products Section */}
      {boosterProducts.length > 0 && (
        <div className="mt-6">
          <h4 className="font-heading club-ink font-bold text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 club-accent" />
            Luck Boosters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boosterProducts.map((product) => (
              <div
                key={product.id}
                className="relative club-purple border club-border rounded-xl p-4 club-border transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 club-surface rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 club-ink " />
                    </div>
                    <div>
                      <h3 className="font-bold club-ink text-sm">{product.name}</h3>
                      <p className="font-heading text-indigo-300/80 text-xs mt-1 leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleSelectProduct(product.id)}
                  disabled={loadingProductId !== null}
                  className="club-action w-full mt-4 club-surface club-ink font-bold text-sm py-2 rounded-lg"
                >
                  {loadingProductId === product.id ? "Loading..." : `₼${(product.priceInCents / 100).toFixed(2)} AZN`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
