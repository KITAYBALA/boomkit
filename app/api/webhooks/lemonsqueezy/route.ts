import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server-client'
import { PRODUCTS } from '@/lib/products'
import { validWebhookSignature, purchaseReward } from '@/lib/payment-validation'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    if (!secret || !storeId) return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 })
    const body = await req.text()
    if (body.length > 1024 * 1024) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    if (!validWebhookSignature(body, req.headers.get('x-signature'), secret)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    const payload = JSON.parse(body)
    const event = payload?.meta?.event_name
    // A subscription purchase also emits order_created. Do not fulfill subscription_created.
    if (event !== 'order_created' && event !== 'subscription_payment_success') return NextResponse.json({ received: true })
    const attributes = payload?.data?.attributes
    if (!attributes || String(attributes.store_id) !== storeId || attributes.test_mode !== false) {
      return NextResponse.json({ error: 'Wrong store or non-live payment' }, { status: 400 })
    }
    if (attributes.status !== 'paid' || attributes.refunded) return NextResponse.json({ received: true })
    const userId = payload.meta?.custom_data?.userId
    if (typeof userId !== 'string' || !userId || userId.length > 128 || !/^\d+$/.test(String(payload.data.id))) {
      return NextResponse.json({ error: 'Invalid purchase metadata' }, { status: 400 })
    }
    let variantId: unknown
    let quantity = 1
    if (event === 'order_created') {
      if (payload.data.type !== 'orders') return NextResponse.json({ error: 'Wrong resource type' }, { status: 400 })
      variantId = attributes.first_order_item?.variant_id
      quantity = attributes.first_order_item?.quantity
    } else {
      if (payload.data.type !== 'subscription-invoices') return NextResponse.json({ error: 'Wrong resource type' }, { status: 400 })
      // The initial grant belongs to the order; only actual renewals grant again.
      if (attributes.billing_reason !== 'renewal') return NextResponse.json({ received: true })
      if (!/^\d+$/.test(String(attributes.subscription_id))) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
      const key = process.env.LEMON_SQUEEZY_API_KEY
      if (!key) throw new Error('Subscription verification is not configured')
      const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${attributes.subscription_id}`, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/vnd.api+json' },
        signal: AbortSignal.timeout(10000), cache: 'no-store',
      })
      if (!response.ok) throw new Error('Unable to verify subscription')
      const subscription = (await response.json()).data?.attributes
      if (!subscription || String(subscription.store_id) !== storeId || subscription.test_mode !== false ||
        String(subscription.customer_id) !== String(attributes.customer_id)) throw new Error('Subscription mismatch')
      variantId = subscription.variant_id
    }
    // Derive all awards from the actual paid variant, never custom token/product metadata.
    const product = PRODUCTS.find(item => item.variantId && item.variantId === String(variantId))
    if (!product || (event === 'subscription_payment_success' && product.type !== 'subscription')) {
      return NextResponse.json({ error: 'Unrecognized paid variant' }, { status: 400 })
    }
    const reward = purchaseReward(product, quantity)
    const { error } = await supabaseServerClient().rpc('fulfill_boomkit_purchase', {
      p_event_key: `${payload.data.type}:${payload.data.id}`, p_user_id: userId, p_product_id: product.id,
      p_tokens: reward.tokens, p_booster: reward.booster, p_plus: reward.plus,
    })
    if (error) throw error
    return NextResponse.json({ received: true })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    console.error('[Payments] Fulfillment failed:', error)
    // Return non-2xx so the provider retries; the receipt and grant share a transaction.
    return NextResponse.json({ error: 'Payment fulfillment unavailable' }, { status: 500 })
  }
}
