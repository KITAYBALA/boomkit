const { test } = require('node:test')
const assert = require('node:assert/strict')
const { stepMergeBoard, weightedRarity } = require('./load-ts.cjs')('lib/merge-game-engine.ts')
const rarities = {
  uncommon: { next: 'rare', nextPoints: 1, tokenAward: 0, emoji: 'U' },
  rare: { next: null, nextPoints: 0, tokenAward: 10, emoji: 'R' },
}
const piece = id => ({ id, x: 50, y: 85, rarity: 'uncommon', emoji: 'U' })

test('three colliding pieces only produce one upgrade and one reward', () => {
  const original = [piece('a'), piece('b'), piece('c')]
  const result = stepMergeBoard(original, rarities, () => 'merged')
  assert.equal(result.pieces.length, 2)
  assert.equal(result.points, 1)
  assert.equal(result.tokens, 10)
  assert.equal(result.pieces.filter(item => item.rarity === 'rare').length, 1)
  assert.equal(original.length, 3)
  assert.equal(original[0].x, 50)
})

test('a completed merge cannot grant its reward on the next tick', () => {
  const first = stepMergeBoard([piece('a'), piece('b')], rarities, () => 'merged')
  const second = stepMergeBoard(first.pieces, rarities, () => 'another')
  assert.equal(second.tokens, 0)
  assert.equal(second.points, 0)
})

test('rarity weights stay nonnegative and normalize when a mode adds drop chances', () => {
  const rates = [{ rarity: 'uncommon', chance: 60 }, { rarity: 'rare', chance: 39.99 }, { rarity: 'mystical', chance: 0.01 }]
  assert.equal(weightedRarity(rates, 20, 0.999999), 'mystical')
  assert.equal(weightedRarity(rates, -500, 0.99999), 'uncommon')
  assert.equal(weightedRarity(rates, 0, 0), 'uncommon')
})
