import { randomInt } from 'node:crypto'
import { z } from 'zod'
import { PACKS, LIMITED_BOOMS, GAMEPASS_BOOMS, RARITY_CHANCES } from './economy-catalog'

const id = z.string().uuid()
export const economyInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('open_pack'), requestId: id, packId: z.string().max(100) }).strict(),
  z.object({ action: z.literal('sell'), requestId: id, boomName: z.string().min(1).max(128), quantity: z.number().int().min(1).max(1000000) }).strict(),
  z.object({ action: z.literal('buy_limited'), requestId: id, boomName: z.string().min(1).max(128) }).strict(),
  z.object({ action: z.literal('spin'), requestId: id }).strict(),
])

export const SPIN_REWARDS = [100, 150, 200, 250, 300, 350, 400, 500]
const sellPrices = { uncommon: 15, rare: 25, epic: 75, legendary: 250, chroma: 500, hidden: 15, mystical: 1000 }
const values = { uncommon: 100, rare: 250, epic: 500, legendary: 1000, chroma: 2000, hidden: 100, mystical: 5000 }
const scores = { uncommon: 10, rare: 15, epic: 25, legendary: 50, chroma: 100, hidden: 10, mystical: 200 }

export function gameMilestoneRewards() {
  return GAMEPASS_BOOMS.map(milestone => {
    const pool = PACKS.flatMap(p => p.booms).filter(b => b.rarity === milestone.rarity)
    return { level: milestone.level, name: milestone.isLimited ? 'The Trophy' : pool[randomInt(pool.length)].name }
  })
}

export function economyDetails(input: z.infer<typeof economyInput>, boost = 1, draw = (max: number) => randomInt(max)) {
  if (input.action === 'spin') return { amount: SPIN_REWARDS[draw(SPIN_REWARDS.length)] }
  if (input.action === 'open_pack') {
    const pack = PACKS.find(p => p.id === input.packId)
    if (!pack) throw new Error('Unknown pack')
    const lucky = new Set(['legendary', 'chroma', 'hidden', 'mystical'])
    const multiplier = Number.isFinite(boost) ? Math.max(1, Math.min(boost, 3)) : 1
    const luckyTotal = Object.entries(RARITY_CHANCES).filter(([rarity]) => lucky.has(rarity)).reduce((sum, [,chance]) => sum+chance, 0)
    const commonScale = (100-luckyTotal*multiplier)/(100-luckyTotal)
    const weights = pack.booms.map(boom => RARITY_CHANCES[boom.rarity] *
      (lucky.has(boom.rarity) ? multiplier : commonScale) /
      pack.booms.filter(b => b.rarity === boom.rarity).length)
    const total = weights.reduce((sum, value) => sum + value, 0)
    let roll = draw(1000000000) / 1000000000 * total
    let index = weights.length - 1
    for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll < 0) { index = i; break } }
    const boom = pack.booms[index]
    return { name: boom.name, price: pack.price, pack_id: pack.id, requires_plus: pack.id === 'plus',
      value: values[boom.rarity], score: scores[boom.rarity], boom }
  }
  if (input.action === 'buy_limited') {
    const boom = LIMITED_BOOMS.find(b => b.name === input.boomName)
    if (!boom) throw new Error('Unknown limited item')
    return { name: boom.name, price: boom.price, value: 5000, score: 200 }
  }
  const boom = PACKS.flatMap(pack => pack.booms).find(b => b.name === input.boomName)
  const rarity = boom?.rarity || (LIMITED_BOOMS.some(b => b.name === input.boomName) || input.boomName === 'The Trophy' ? 'mystical' : 'uncommon')
  return { name: input.boomName, quantity: input.quantity, price: sellPrices[rarity], value: values[rarity], score: scores[rarity] }
}
