import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Product } from './products'

export function validWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false
  return timingSafeEqual(createHmac('sha256', secret).update(body).digest(), Buffer.from(signature, 'hex'))
}

export function purchaseReward(product: Product, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Invalid purchase quantity')
  if (quantity !== 1) throw new Error('Only single-quantity checkouts are supported')
  return {
    tokens: product.type === 'subscription' ? 10000 : product.tokens ?? 0,
    booster: product.type === 'subscription' ? 'luck-charm-2x-1h' : product.type === 'booster' ? product.id : null,
    plus: product.type === 'subscription',
  }
}
