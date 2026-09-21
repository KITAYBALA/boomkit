export const PUBLIC_USER_FIELDS = [
  'id', 'username', 'tokens', 'packs', 'booms', 'role', 'is_owner', 'is_banned', 'is_muted', 'status',
  'join_date', 'boom_score', 'total_value', 'profile_picture', 'is_plus_user', 'name_color', 'banner_color',
  'badges', 'last_seen', 'packs_opened', 'xp', 'level', 'clan_id', 'clan_role', 'clan_tag', 'clan_tag_color',
  'pinned_boom', 'games_played', 'correct_answers_count', 'questions_answered_count',
] as const
export const PRIVATE_USER_FIELDS = ['email', 'age', 'reason', 'ban_reason', 'ban_expiry', 'mute_expiry',
  'inventory', 'daily_tokens', 'last_daily_spin', 'login_streak', 'last_streak_claim', 'season_xp',
  'has_plus_pass', 'discover_tokens_earned', 'total_tokens_earned', 'plus_reward_expires_at',
  'fusion_cooldown_ends_at', 'consecutive_fusions', 'last_fusion_claim_time', 'active_fusion_boom1',
  'active_fusion_boom2', 'active_fusion_ends_at', 'active_fusion_started_at'] as const

export function serializeUser(row: Record<string, any>, privateAccess = false) {
  const result: Record<string, any> = {}
  for (const key of [...PUBLIC_USER_FIELDS, ...(privateAccess ? PRIVATE_USER_FIELDS : [])]) {
    if (Object.hasOwn(row, key)) result[key] = row[key]
  }
  if (row.is_banned && row.ban_expiry && new Date(row.ban_expiry).getTime() <= Date.now()) result.is_banned = false
  if (row.is_muted && row.mute_expiry && new Date(row.mute_expiry).getTime() <= Date.now()) result.is_muted = false
  result.is_plus_user = Boolean(row.is_plus_user || row.has_plus_pass || new Date(row.plus_reward_expires_at || 0).getTime() > Date.now())
  if (privateAccess) result.has_plus_pass = Boolean(row.has_plus_pass || new Date(row.plus_reward_expires_at || 0).getTime() > Date.now())
  return result
}
