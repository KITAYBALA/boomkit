import { z } from 'zod'

const text = z.string().trim().min(1).max(128)
const uuid = z.string().uuid()
const amount = z.number().int().positive().max(1000000000)
const score = z.number().int().min(0).max(10000000)
const schemas = {
  transfer_tokens: z.object({ p_receiver_username: text, p_amount: amount }),
  transfer_boom: z.object({ p_receiver_username: text, p_boom_name: text, p_amount: amount }),
  send_friend_request: z.object({ p_to: text }),
  accept_friend_request: z.object({ p_from: text }),
  remove_friend: z.object({ p_friend: text }),
  list_boom_rental: z.object({p_boom_name:text,p_price:amount,p_sessions:z.number().int().min(1).max(100)}),
  rent_boom: z.object({p_rental_id:uuid}),
  cancel_rental: z.object({p_rental_id:uuid}),
  craft_boom: z.object({ p_recipe_id: uuid }),
  claim_daily_streak: z.object({}),
  buy_shop_item: z.object({ p_item_id: uuid }),
  fuse_booms: z.object({ p_boom1: text, p_boom2: text }),
  claim_fusion_result: z.object({}),
  create_clan: z.object({ p_clan_name: text, p_tag: text, p_description: z.string().max(1000), p_logo: text, p_tag_color: text }),
  join_clan: z.object({ p_clan_id: uuid }),
  leave_clan: z.object({}),
  donate_to_clan: z.object({ p_amount: amount }),
  kick_from_clan: z.object({ p_target_username: text }),
  transfer_clan_leadership: z.object({ p_target_username: text }),
  update_clan_member_role: z.object({ p_target_username: text, p_new_role: z.enum(['co_leader', 'member']) }),
  update_clan_info: z.object({ p_description: z.string().max(1000), p_logo: text, p_tag_color: text,
    p_min_tokens: score, p_min_rarity: z.enum(['uncommon','rare','epic','legendary','chroma','hidden','mystical']), p_min_rarity_count: score }),
  buy_clan_upgrade: z.object({ p_upgrade_type: text, p_color_value: z.string().max(100).nullable().optional() }),
  join_tournament_clan: z.object({ p_tournament_id: uuid }),
  create_tournament: z.object({ p_title: text, p_description: z.string().max(2000), p_end_time: z.string().datetime(), p_prize_tokens: score, p_prize_boom_name: text.nullable() }),
  start_new_season: z.object({ p_season_name: text }),
  finalize_tournament: z.object({ p_tournament_id: uuid }),
  log_user_activity: z.object({ p_type: text, p_desc: z.string().max(500), p_details: z.record(z.unknown()).optional() }),
  check_achievements: z.object({ p_type: z.enum(['games_played', 'booms_collected', 'evolved_count']), p_value: score.optional() }),
  create_auction: z.object({ p_boom_name: text, p_starting_bid: amount, p_duration_hours: z.number().int().min(1).max(168) }),
  place_bid: z.object({ p_auction_id: uuid, p_amount: amount }),
  claim_auction: z.object({ p_auction_id: uuid }),
  reclaim_auction_item: z.object({ p_auction_id: uuid }),
  accept_trade: z.object({ trade_uuid: uuid }),
}

const staffMethods = new Set(['create_tournament', 'finalize_tournament', 'start_new_season'])
const noUsername = new Set(['finalize_tournament', 'reclaim_auction_item', 'accept_trade', 'create_auction', 'claim_auction', 'update_game_score'])

export function authorizedRpc(method: string, params: unknown, actor: { id: string; username: string; role: string; is_owner: boolean }) {
  if (!Object.hasOwn(schemas, method)) throw new Error('Unsupported operation')
  if (staffMethods.has(method) && !actor.is_owner && !['owner', 'admin', 'senior_moderator', 'moderator'].includes(actor.role)) {
    throw new Error('Staff permission required')
  }
  // Strip client-supplied identities before binding the signed-in actor.
  const data: Record<string, unknown> = schemas[method as keyof typeof schemas].parse(params)
  if (method.startsWith('transfer_') && ['transfer_tokens', 'transfer_boom'].includes(method)) data.p_sender_username = actor.username
  else if (method === 'send_friend_request') data.p_from = actor.username
  else if (method === 'craft_boom') data.p_player_username = actor.username
  else if (['list_boom_rental','cancel_rental'].includes(method)) data.p_owner=actor.username
  else if (method==='rent_boom') data.p_renter=actor.username
  else if (['create_tournament', 'start_new_season'].includes(method)) data.p_creator_id = actor.id
  else if (!noUsername.has(method)) data.p_username = actor.username
  if (['create_auction', 'place_bid', 'claim_auction'].includes(method)) data.p_user_id = actor.id
  if (method === 'update_game_score') {
    data.p_player_id = actor.id
    data.p_player_username = actor.username
  }
  return data
}
