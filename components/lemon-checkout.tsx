"use client"

import { useEffect, useState } from "react"
import { createLemonCheckout } from "@/app/actions/lemonsqueezy"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/products"
import { Coins, Sparkles, Crown, Palette, BadgeCheck } from "lucide-react"
import { toast } from "sonner"

interface LemonCheckoutProps {
  userId: string
  onSuccess?: (tokens: number) => void
}

export default function LemonCheckout({ userId }: LemonCheckoutProps) {
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
          <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Premium Membership
          </h4>
          {subscriptionProducts.map((product) => (
            <div
              key={product.id}
              className="relative bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-2 border-yellow-500/50 rounded-xl p-5 hover:border-yellow-400 transition-all"
            >
              <div className="absolute -top-3 left-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">{product.name}</h3>
                  <p className="text-yellow-200 text-sm">{product.description}</p>
                </div>
              </div>
              {product.features && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {product.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-white text-sm bg-white/10 rounded-lg px-3 py-2"
                    >
                      {feature.includes("Banner") && <Palette className="w-4 h-4 text-purple-400" />}
                      {feature.includes("Role") && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                      {feature.includes("Color") && <Sparkles className="w-4 h-4 text-pink-400" />}
                      {feature}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => handleSelectProduct(product.id)}
                disabled={loadingProductId !== null}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg py-3"
              >
                {loadingProductId === product.id ? "Loading..." : `Get Plus - ₼${(product.priceInCents / 100).toFixed(2)} AZN/month`}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Token Products Section */}
      <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-400" />
        Token Packs
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tokenProducts.map((product) => (
          <div
            key={product.id}
            className="relative bg-purple-900/50 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400 transition-all"
          >
            {product.bonus && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {product.bonus}
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{product.name}</h3>
                <p className="text-purple-300 text-sm">{product.tokens?.toLocaleString()} Tokens</p>
              </div>
            </div>
            <p className="text-purple-200 text-sm mb-4">{product.description}</p>
            <Button
              onClick={() => handleSelectProduct(product.id)}
              disabled={loadingProductId !== null}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              {loadingProductId === product.id ? "Loading..." : `₼${(product.priceInCents / 100).toFixed(2)} AZN`}
            </Button>
          </div>
        ))}
      </div>

      {/* Booster Products Section */}
      {boosterProducts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Luck Boosters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boosterProducts.map((product) => (
              <div
                key={product.id}
                className="relative bg-indigo-950/45 border border-indigo-500/20 rounded-xl p-4 hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{product.name}</h3>
                      <p className="text-indigo-300/80 text-xs mt-1 leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleSelectProduct(product.id)}
                  disabled={loadingProductId !== null}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-2 rounded-lg"
                >
                  {loadingProductId === product.id ? "Loading..." : `₼${(product.priceInCents / 100).toFixed(2)} AZN`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sandbox Simulator Block */}
      <div className="mt-8 p-6 bg-slate-950/60 border border-dashed border-red-500/30 rounded-2xl relative overflow-hidden">
        <h4 className="text-red-400 font-bold text-sm mb-1.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-400" />
          🛠️ DEVELOPER SANDBOX
        </h4>
        <p className="text-white/40 text-xs mb-4">
          Test purchase event handling and instantly credit your user account without active billing configurations.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/debug/purchase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: "tokens-10k" }),
                });
                const d = await res.json();
                if (d.success) {
                  toast.success(d.message);
                  if (typeof window !== "undefined") (window as any).refreshUserSession?.();
                } else toast.error(d.message);
              } catch (e) {
                toast.error("Sandbox simulation failed");
              }
            }}
            className="bg-slate-900 border border-white/10 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            +10k Tokens
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/debug/purchase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: "boomkit-plus" }),
                });
                const d = await res.json();
                if (d.success) {
                  toast.success(d.message);
                  if (typeof window !== "undefined") (window as any).refreshUserSession?.();
                } else toast.error(d.message);
              } catch (e) {
                toast.error("Sandbox simulation failed");
              }
            }}
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:border-yellow-400 text-yellow-400 text-xs font-semibold"
          >
            Buy Plus Sub
          </Button>
          {boosterProducts.map((bp) => (
            <Button
              key={bp.id}
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/debug/purchase", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: bp.id }),
                  });
                  const d = await res.json();
                  if (d.success) {
                    toast.success(d.message);
                    if (typeof window !== "undefined") (window as any).refreshUserSession?.();
                  } else toast.error(d.message);
                } catch (e) {
                  toast.error("Sandbox simulation failed");
                }
              }}
              className="bg-indigo-950/40 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 text-xs font-semibold"
            >
              + {bp.name.split(" ")[0]} {bp.name.includes("SUPER") ? "Super" : bp.name.split(" ")[2]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
