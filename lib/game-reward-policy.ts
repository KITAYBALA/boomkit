import { createHash } from 'node:crypto'
import { z } from 'zod'
import { FALLBACK_QUESTIONS, TOPIC_FALLBACKS } from './fallback-questions'
import { CURATED_TOPIC_QUESTIONS } from './curated-curriculum'

const question = z.object({ question: z.string().max(2000), options: z.array(z.string().max(1000)).min(2).max(8) })
export const gameRewardInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), runId: z.string().uuid(), sessionPin:z.string().regex(/^\d{6}$/).optional(), duration: z.number().int().min(10).max(3600), questions: z.array(question).min(1).max(100) }).strict(),
  z.object({ action: z.literal('answer'), runId: z.string().uuid(), ordinal: z.number().int().min(0).max(1200), answer: z.number().int().min(-1).max(7) }).strict(),
  z.object({ action: z.literal('finish'), runId: z.string().uuid() }).strict(),
])
const key = (q: { question: string; options: string[] }) => JSON.stringify([q.question, q.options])
const trusted = new Map(Object.values({ ...FALLBACK_QUESTIONS, ...TOPIC_FALLBACKS, ...CURATED_TOPIC_QUESTIONS }).flat().map(q => [key(q), q.correctIndex]))

export function verifiedQuestionKeys(questions: { question: string; options: string[] }[]) {
  return questions.map(q => ({ key: createHash('sha256').update(key(q)).digest('hex'), correct: trusted.get(key(q)) ?? null }))
}
