import { z } from 'zod'
export const sessionQuestion = z.object({ id: z.string().max(128), question: z.string().min(1).max(2000), options: z.array(z.string().min(1).max(1000)).min(2).max(8), correctIndex: z.number().int().min(0).max(7) }).refine(q => q.correctIndex < q.options.length)
const pin = z.string().regex(/^\d{6}$/)
export const sessionInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), grade: z.number().int().min(1).max(12), subject: z.string().min(1).max(200), questions: z.array(sessionQuestion).min(1).max(100), duration: z.number().int().min(10).max(3600), mode: z.string().regex(/^[a-z-]{1,40}$/), settings: z.object({}).passthrough().optional() }).strict(),
  z.object({ action: z.literal('join'), pin }).strict(),
  z.object({ action: z.literal('read'), pin }).strict(),
  z.object({ action: z.literal('start'), pin, duration: z.number().int().min(10).max(3600) }).strict(),
  z.object({ action: z.literal('finish'), pin }).strict(),
])
