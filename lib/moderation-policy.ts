type Account = { role: string; is_owner?: boolean }
const staffRoles = new Set(['owner', 'admin', 'senior_moderator', 'moderator'])

export function isModerator(user: Account) {
  return Boolean(user.is_owner) || staffRoles.has(user.role)
}

export function canModerate(actor: Account, target: Account) {
  if (actor.is_owner || actor.role === 'owner') return true
  if (!isModerator(actor) || target.is_owner || target.role === 'owner') return false
  return actor.role === 'admin' || !isModerator(target)
}
