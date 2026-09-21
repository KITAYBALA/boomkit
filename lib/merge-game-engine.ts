export interface MergePiece {
  id: string
  rarity: string
  emoji: string
  x: number
  y: number
}

type Rarity = { next: string | null; nextPoints: number; emoji: string; tokenAward: number }

export function weightedRarity(rates: { rarity: string; chance: number }[], shift: number, random: number): string {
  const adjusted = rates.map(item => ({ ...item, chance: Math.max(0, item.chance + (item.rarity === 'uncommon' ? 0 : shift / 5)) }))
  const total = adjusted.reduce((sum, item) => sum + item.chance, 0)
  let target = Math.min(1 - Number.EPSILON, Math.max(0, random)) * total
  for (const item of adjusted) {
    target -= item.chance
    if (target < 0) return item.rarity
  }
  return 'uncommon'
}

export function stepMergeBoard(pieces: MergePiece[], rarities: Record<string, Rarity>, createId: () => string) {
  const next = pieces.map(piece => {
    let y = piece.y < 85 ? piece.y + 2 : piece.y
    let x = piece.x
    for (const other of pieces) {
      if (other.id === piece.id) continue
      const dx = piece.x - other.x
      const dy = piece.y - other.y
      const distance = Math.hypot(dx, dy)
      if (distance < 8) {
        x += Math.cos(Math.atan2(dy, dx)) * (8 - distance) / 2
        if (dy < 0) y -= 1
      }
    }
    return { ...piece, x: Math.max(5, Math.min(95, x)), y: Math.min(85, y) }
  })
  const removed = new Set<string>()
  const merged: MergePiece[] = []
  let points = 0
  let tokens = 0
  let reachedTopTier = false
  for (let i = 0; i < next.length; i++) {
    if (removed.has(next[i].id)) continue
    for (let j = i + 1; j < next.length; j++) {
      const a = next[i], b = next[j]
      if (removed.has(b.id) || a.rarity !== b.rarity || a.y <= 80 || b.y <= 80 || Math.hypot(a.x - b.x, a.y - b.y) >= 15) continue
      const rarity = rarities[a.rarity]
      if (!rarity?.next) continue
      const upgraded = rarities[rarity.next]
      merged.push({ id: createId(), rarity: rarity.next, emoji: upgraded.emoji, x: (a.x + b.x) / 2, y: 85 })
      removed.add(a.id)
      removed.add(b.id)
      points += rarity.nextPoints
      tokens += upgraded.tokenAward
      reachedTopTier ||= upgraded.next === null
      break // A piece can participate in at most one merge per tick.
    }
  }
  return { pieces: [...next.filter(piece => !removed.has(piece.id)), ...merged], points, tokens, reachedTopTier }
}
