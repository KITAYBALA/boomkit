"use client"

import { useCallback, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PRODUCTS } from "@/lib/products"
import { Coins, Sparkles, X, Crown, Palette, BadgeCheck } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  userId: string
  onSuccess?: (tokens: number) => void
}

export default function StripeCheckout({ userId, onSuccess }: StripeCheckoutProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const startCheckoutSessionForProduct = useCallback(async () => {
    if (!selectedProduct) return Promise.reject("No product selected")
    const clientSecret = await startCheckoutSession(selectedProduct, userId)
    if (!clientSecret) throw new Error("Stripe did not return a client secret")
    return clientSecret
  }, [selectedProduct, userId])

  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId)
    setShowCheckout(true)
  }

  const handleClose = () => {
    setShowCheckout(false)
    setSelectedProduct(null)
  }

  const tokenProducts = PRODUCTS.filter((p) => p.type === "tokens")
  const subscriptionProducts = PRODUCTS.filter((p) => p.type === "subscription")

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
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg py-3"
              >
                Get Plus - ${(product.priceInCents / 100).toFixed(2)}/month
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
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              ${(product.priceInCents / 100).toFixed(2)}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg bg-white p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-purple-600 text-white">
            <DialogTitle className="flex items-center justify-between">
              <span>Complete Purchase</span>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-purple-500">
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedProduct && (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret: startCheckoutSessionForProduct }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
