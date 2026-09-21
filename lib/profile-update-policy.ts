import { z } from 'zod'
const amount = z.number().int().min(0).max(1000000000)
const profile = z.object({
  username: z.string().trim().min(3).max(20).optional(),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()).optional(),
  age: z.number().int().min(13).max(120).optional(), reason: z.string().max(1000).optional(),
  profile_picture: z.string().max(512).optional(), name_color: z.string().max(100).optional(),
  banner_color: z.string().max(100).optional(), pinned_boom: z.string().max(128).nullable().optional(),
  last_seen: z.number().int().min(0).optional(),
}).strict()
const moderation = z.object({
  status: z.enum(['pending','approved','rejected']).optional(), is_banned: z.boolean().optional(),
  is_muted: z.boolean().optional(), ban_reason: z.string().max(1000).nullable().optional(),
  ban_expiry: z.number().int().min(0).nullable().optional(), mute_expiry: z.number().int().min(0).nullable().optional(),
}).strict()
const admin = profile.merge(moderation).extend({
  role: z.string().regex(/^[a-z_]{1,40}$/).optional(), is_owner: z.boolean().optional(),
  is_plus_user: z.boolean().optional(), badges: z.array(z.string().max(128)).max(100).optional(),
  tokens: amount.optional(), daily_tokens: amount.optional(), packs_opened: amount.optional(),
  boom_score: amount.optional(), total_value: amount.optional(), xp: amount.optional(),
  level: z.number().int().min(1).max(100).optional(),
  booms: z.record(z.string().min(1).max(128), z.number().int().min(0).max(1000000)).optional(),
  packs: z.array(z.string().max(128)).max(1000).optional(),
}).strict()
export function parseProfileUpdates(updates: unknown, actor: { id: string; role: string; is_owner: boolean }, targetId: string) {
  const elevated = actor.is_owner || ['owner','admin'].includes(actor.role)
  const schema = elevated ? admin : actor.id === targetId ? profile : moderation
  const parsed = schema.parse(updates)
  if ('last_seen' in parsed) parsed.last_seen = Date.now()
  return parsed
}
