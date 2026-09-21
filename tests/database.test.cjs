const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
let db
const root = path.resolve(__dirname, '..')
const scalar = async (sql, params = []) => (await db.query(sql, params)).rows[0]

before(async () => {
  db = new PGlite()
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;')
  await db.exec(fs.readFileSync(path.join(root, 'scripts/create_users_table_v1.sql'), 'utf8'))
  await db.exec(`
    ALTER TABLE users ADD COLUMN packs_opened integer DEFAULT 0, ADD COLUMN season_xp integer DEFAULT 0,
      ADD COLUMN has_plus_pass boolean DEFAULT false, ADD COLUMN inventory jsonb DEFAULT '[]';
    ALTER TABLE users ADD COLUMN level integer DEFAULT 1, ADD COLUMN xp integer DEFAULT 0,
      ADD COLUMN pinned_boom text, ADD COLUMN discover_tokens_earned integer DEFAULT 0,
      ADD COLUMN games_played integer DEFAULT 0, ADD COLUMN total_tokens_earned integer DEFAULT 0,
      ADD COLUMN correct_answers_count integer DEFAULT 0, ADD COLUMN questions_answered_count integer DEFAULT 0;
    ALTER TABLE users ADD COLUMN clan_id uuid;
    CREATE TABLE clans(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),xp integer DEFAULT 0,level integer DEFAULT 1,xp_multiplier numeric DEFAULT 1);
    ALTER TABLE clans ADD COLUMN bank_tokens integer DEFAULT 0,ADD COLUMN member_limit integer DEFAULT 15,ADD COLUMN unlocked_colors text[] DEFAULT '{}';
    ALTER TABLE users ADD COLUMN clan_role text;
    CREATE TABLE game_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),pin text UNIQUE,host_id text,host_username text,grade integer,subject text,questions jsonb,status text,duration integer,players jsonb,created_at timestamptz DEFAULT now());
    CREATE TABLE custom_sets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),creator_id text,is_public boolean);
    CREATE TABLE clan_chat_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),clan_id uuid,username text,message text,created_at timestamptz DEFAULT now());
    CREATE TABLE promo_codes(code text PRIMARY KEY,tokens_reward integer,current_uses integer DEFAULT 0,max_uses integer,expires_at timestamptz);
    CREATE TABLE promo_redemptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text,username text,UNIQUE(code,username));
    CREATE TABLE tournaments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),status text,start_time timestamptz,end_time timestamptz);
    CREATE TABLE tournament_clans(tournament_id uuid,clan_id uuid,score integer DEFAULT 0,games_played integer DEFAULT 0,last_played timestamptz);
    CREATE TABLE user_boom_evolution(username text,boom_name text,xp integer,level integer,is_fully_evolved boolean,UNIQUE(username,boom_name));
    CREATE TABLE user_secrets(user_id text PRIMARY KEY REFERENCES users(id), password_hash text, last_ip text, mac_address text, password_reset_required boolean DEFAULT false);
    CREATE TABLE access_keys(key text PRIMARY KEY, is_used boolean DEFAULT false, used_by_username text,discord_user_id text);
    CREATE TABLE rate_limits(ip text PRIMARY KEY, count integer NOT NULL, reset_time timestamptz NOT NULL);
    CREATE TABLE seasons(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), is_active boolean, start_date timestamptz, end_date timestamptz);
    CREATE TABLE season_rewards(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), season_id uuid REFERENCES seasons(id), tier integer, xp_required integer, reward_type text, reward_value text, is_premium boolean);
    CREATE TABLE claimed_season_rewards(user_id text REFERENCES users(id), reward_id uuid REFERENCES season_rewards(id), PRIMARY KEY(user_id,reward_id));
    CREATE TABLE active_boosts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activated_by text, multiplier numeric, duration_hours integer, ends_at timestamptz);
    CREATE TABLE trades(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id text, receiver_id text, sender_username text, receiver_username text,
      sender_tokens numeric, receiver_tokens numeric, sender_booms jsonb, receiver_booms jsonb, status text, updated_at timestamptz);
    CREATE TABLE auction_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), boom_name text, seller text, current_bid integer, ends_at timestamptz, status text, top_bidder text, bidders jsonb DEFAULT '[]');
    CREATE TABLE conversations(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE conversation_members(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE direct_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
    CREATE TABLE chat_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reactions jsonb DEFAULT '{}');
  `)
  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/025_atomic_auth_and_rewards.sql'), 'utf8')
  await db.exec(migration)
  await db.exec(migration)
  const marketMigration = fs.readFileSync(path.join(root, 'supabase/migrations/026_rpc_and_market_security.sql'), 'utf8')
  await db.exec(`
    CREATE FUNCTION accept_trade(trade_uuid uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
    CREATE FUNCTION place_bid(p_auction_id uuid, p_amount integer, p_username text, p_user_id text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
  `)
  await db.exec(marketMigration)
  await db.exec(marketMigration)
  for (const name of ['027_server_economy_and_profile_privacy.sql', '028_verified_game_rewards.sql']) {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8')
    await db.exec(sql)
    await db.exec(sql)
  }
  await db.exec("CREATE FUNCTION check_user_ownership(text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$; CREATE FUNCTION log_user_activity(text,text,text,jsonb) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;")
  const legacy=fs.readFileSync(path.join(root,'supabase/migrations/021_secure_security_definer_functions.sql'),'utf8')
  for (const name of ['donate_to_clan','buy_clan_upgrade']) {
    const start=legacy.indexOf('CREATE OR REPLACE FUNCTION public.'+name+'(')
    const end=legacy.indexOf('$$;',start)+3
    await db.exec(legacy.slice(start,end))
  }
  for (const name of ['029_multiplayer_and_browser_boundaries.sql','030_legacy_transactions_and_discord.sql']) {
    const sql=fs.readFileSync(path.join(root,'supabase/migrations',name),'utf8')
    await db.exec(sql); await db.exec(sql)
  }
})
after(async () => { await db?.close() })

const hash = 'scrypt$16384$8$1$' + 'a'.repeat(32) + '$' + 'b'.repeat(128)
const { randomUUID } = require('node:crypto')

test('room membership and host controls are enforced; scores come only from verified answers', async () => {
 const host=await economyUser('RoomHost'), guest=await economyUser('RoomGuest'), stranger=await economyUser('RoomStranger')
 const pin='987654'
 const room=(user,action,details={})=>scalar('SELECT secure_game_session($1,$2,$3,$4) AS result',[user,pin,action,details])
 const question={id:'q',question:'2+2?',options:['4','3'],correctIndex:0}
 await room(host,'create',{grade:1,subject:'Math',questions:[question],duration:60,mode:'classic'})
 await assert.rejects(room(stranger,'read'),/Join this room/)
 await room(guest,'join'); await room(guest,'join')
 assert.equal((await room(host,'read')).result.players.length,2)
 await assert.rejects(room(guest,'start',{duration:60}),/Only the host/)
 await room(host,'start',{duration:60})
 const run=randomUUID()
 const game=(user,action,details={})=>scalar('SELECT apply_boomkit_game_action($1,$2,$3,$4) AS result',[user,run,action,details])
 await assert.rejects(game(stranger,'start',{session_pin:pin,duration:60,questions:[{key:'known',correct:0}]}),/joined room/)
 await game(guest,'start',{session_pin:pin,duration:60,questions:[{key:'known',correct:0}]})
 await game(guest,'answer',{ordinal:0,answer:0})
 const player=(await room(host,'read')).result.players.find(p=>p.id===guest)
 assert.equal(player.score,10)
 await assert.rejects(room(guest,'finish'),/Only the host/)
 await room(host,'finish')
 await assert.rejects(room(stranger,'join'),/ended/)
 await assert.rejects(game(guest,'answer',{ordinal:1,answer:0}),/ended/)
})

test('game runs cannot be rebound and expired rooms reject joins', async () => {
 const id=await economyUser('ReplayRoom'), other=await economyUser('LateJoiner'), run=randomUUID()
 const start=(details)=>scalar("SELECT apply_boomkit_game_action($1,$2,'start',$3)",[id,run,{duration:60,questions:[{key:'known',correct:0}],...details}])
 await start({})
 await assert.rejects(start({session_pin:'123456'}),/different session/)
 await scalar("SELECT secure_game_session($1,'123456','create',$2)",[id,{grade:1,subject:'Math',duration:60,questions:[],mode:'classic'}])
 await scalar("SELECT secure_game_session($1,'123456','start','{\"duration\":60}')",[id])
 await db.exec("UPDATE game_sessions SET status='started:1000' WHERE pin='123456'")
 await assert.rejects(scalar("SELECT secure_game_session($1,'123456','join','{}')",[other]),/ended/)
})

test('inventory checks reject corrupt values and allow service writes', async () => {
 const id=await economyUser('InventoryCheck')
 await db.exec('SET ROLE service_role')
 try {
  await db.query('UPDATE users SET booms=$2 WHERE id=$1',[id,{Valid:2}])
  for(const booms of [{Bad:-1},{Bad:0.5},{Bad:'2'},[]]) await assert.rejects(db.query('UPDATE users SET booms=$2 WHERE id=$1',[id,booms]),/users_valid_inventory/)
 } finally { await db.exec('RESET ROLE') }
})

test('clan chat requires membership and enforces mutes', async () => {
 const id=await economyUser('ChatMember')
 const {id:clan}=await scalar('INSERT INTO clans DEFAULT VALUES RETURNING id')
 await assert.rejects(scalar('SELECT secure_clan_chat($1,$2,$3)',[id,clan,'hello']),/membership/)
 await db.query('UPDATE users SET clan_id=$2 WHERE id=$1',[id,clan])
 const {messages}=await scalar('SELECT secure_clan_chat($1,$2,$3) AS messages',[id,clan,'hello'])
 assert.equal(messages[0].username,'ChatMember')
 await db.query('UPDATE users SET is_muted=true,mute_expiry=null WHERE id=$1',[id])
 await assert.rejects(scalar('SELECT secure_clan_chat($1,$2,$3)',[id,clan,'blocked']),/muted/)
})

test('browser roles cannot mutate any application table or read private rooms/sets', async () => {
 const result=await scalar("SELECT has_table_privilege('anon','game_sessions','UPDATE') AS game_write,has_table_privilege('anon','game_sessions','SELECT') AS game_read,has_table_privilege('authenticated','custom_sets','SELECT') AS sets,has_table_privilege('anon','clan_chat_messages','INSERT') AS chat,has_schema_privilege('anon','public','CREATE') AS schema_create,has_function_privilege('anon','secure_game_session(text,text,text,jsonb)','EXECUTE') AS rpc")
 assert.deepEqual(result,{game_write:false,game_read:false,sets:false,chat:false,schema_create:false,rpc:false})
})

test('legacy clan operations lock before reading and reject unaffordable repeat upgrades', async () => {
 const id=await economyUser('LegacyClan')
 const {id:clan}=await scalar('INSERT INTO clans(bank_tokens) VALUES(20000) RETURNING id')
 await db.query("UPDATE users SET clan_id=$2,clan_role='leader' WHERE id=$1",[id,clan])
 await scalar("SELECT donate_to_clan('LegacyClan',50)")
 await assert.rejects(scalar("SELECT donate_to_clan('LegacyClan',60)"),/Insufficient/)
 await scalar("SELECT buy_clan_upgrade('LegacyClan','member_limit',null)")
 await assert.rejects(scalar("SELECT buy_clan_upgrade('LegacyClan','member_limit',null)"),/Insufficient/)
 assert.equal((await scalar('SELECT tokens FROM users WHERE id=$1',[id])).tokens,50)
 assert.equal((await scalar('SELECT bank_tokens FROM clans WHERE id=$1',[clan])).bank_tokens,10050)
 await assert.rejects(db.query('UPDATE users SET tokens=-1 WHERE id=$1',[id]),/users_nonnegative_tokens/)
})

test('Discord coinflip, daily and promo rewards are atomic and replay-safe', async () => {
 const id=await economyUser('DiscordPlayer')
 await db.query("UPDATE users SET tokens=1000 WHERE id=$1",[id])
 await db.query("INSERT INTO access_keys(key,is_used,used_by_username,discord_user_id) VALUES('discord-key',true,'DiscordPlayer','discord-1')")
 const wallet=(event,action,amount=0,win=false,code=null)=>scalar('SELECT discord_wallet_action($1,$2,$3,$4,$5,$6) AS result',['discord-1',event,action,amount,win,code])
 assert.equal((await wallet('flip-1','coinflip',100,true)).result.balance,1100)
 assert.equal((await wallet('flip-1','coinflip',100,true)).result.balance,1100)
 await assert.rejects(wallet('flip-2','coinflip',100,true),/cooldown/)
 assert.equal((await wallet('daily-1','daily')).result.balance,1150)
 await assert.rejects(wallet('daily-2','daily'),/Already claimed/)
 await db.query("INSERT INTO promo_codes(code,tokens_reward,max_uses) VALUES('SAFE',500,1)")
 assert.equal((await wallet('promo-1','promo',0,false,'SAFE')).result.balance,1650)
 await wallet('promo-1','promo',0,false,'SAFE')
 await assert.rejects(wallet('promo-2','promo',0,false,'SAFE'),/unavailable|redeemed/)
 assert.equal((await scalar("SELECT current_uses FROM promo_codes WHERE code='SAFE'")).current_uses,1)
 assert.equal((await scalar('SELECT tokens FROM users WHERE id=$1',[id])).tokens,1650)
})
test('public column grants block PII, SELECT star and credential tables', async () => {
  const result = await scalar("SELECT has_column_privilege('anon','users','username','SELECT') AS public, has_column_privilege('anon','users','email','SELECT') AS email, has_column_privilege('authenticated','users','reason','SELECT') AS reason, has_table_privilege('anon','verified_game_runs','SELECT') AS runs")
  assert.deepEqual(result, { public: true, email: false, reason: false, runs: false })
  await db.exec('SET ROLE anon')
  try {
    await db.query('SELECT username FROM users')
    await assert.rejects(db.query('SELECT * FROM users'), /permission denied/)
    await assert.rejects(db.query('SELECT email FROM users'), /permission denied/)
  } finally { await db.exec('RESET ROLE') }
})

async function economyUser(name) {
  const { id } = await scalar("INSERT INTO users(id,username,email,age,join_date,status,tokens) VALUES($1,$2,$3,18,'today','approved',100) RETURNING id", [randomUUID(),name,`${name}@example.test`])
  return id
}
test('pack purchases and sales are atomic, replay-safe and reject overspending', async () => {
  const id = await economyUser('Economy')
  const request = randomUUID()
  const act = (action, details, req = randomUUID()) => scalar('SELECT apply_boomkit_economy_action($1,$2,$3,$4) AS result', [id,req,action,details])
  const pack = { name:'Test Boom',price:25,pack_id:'test',score:10,value:100,boom:{ name:'Test Boom' } }
  await act('open_pack',pack,request)
  await act('open_pack',pack,request)
  assert.deepEqual(await scalar('SELECT tokens,booms,packs_opened FROM users WHERE id=$1',[id]),{ tokens:75,booms:{ 'Test Boom':1 },packs_opened:1 })
  await assert.rejects(act('open_pack',{ ...pack, price: 100 }), /Insufficient/)
  await assert.rejects(act('sell',{ ...pack,quantity:-1 }), /quantity/)
  await assert.rejects(act('sell',{ ...pack,quantity:2 }), /quantity/)
  const saleId = randomUUID()
  await act('sell',{ ...pack,price:15,quantity:1 },saleId)
  await act('sell',{ ...pack,price:15,quantity:1 },saleId)
  assert.deepEqual(await scalar('SELECT tokens,booms FROM users WHERE id=$1',[id]),{ tokens:90,booms:{} })
  await assert.rejects(act('spin',{ amount:100 },saleId), /another action/)
})
test('spin is once per UTC day and premium/limited gates are server-side', async () => {
  const id = await economyUser('Spinner')
  const act = (action, details) => scalar('SELECT apply_boomkit_economy_action($1,$2,$3,$4) AS result',[id,randomUUID(),action,details])
  await act('spin',{ amount:500 })
  await assert.rejects(act('spin',{ amount:500 }), /Already spun/)
  await assert.rejects(act('open_pack',{ name:'Plus',price:1,requires_plus:true }), /Plus membership/)
  await assert.rejects(act('buy_limited',{ name:'Limited',price:1 }), /level 70/)
  assert.equal((await scalar('SELECT tokens FROM users WHERE id=$1',[id])).tokens,600)
})
test('game answers are owner-bound and settle only verified rewards once', async () => {
  const id = await economyUser('Player')
  const other = await economyUser('OtherPlayer')
  const run = randomUUID()
  const act = (action,details={},user=id) => scalar('SELECT apply_boomkit_game_action($1,$2,$3,$4) AS result',[user,run,action,details])
  await act('start',{duration:60,questions:[{key:'known',correct:1},{key:'custom',correct:null}]})
  await assert.rejects(act('answer',{ordinal:0,answer:1},other), /not found/)
  await assert.rejects(act('answer',{ordinal:1,answer:1}), /out of order/)
  await act('answer',{ordinal:0,answer:1})
  await act('answer',{ordinal:0,answer:1})
  await assert.rejects(act('answer',{ordinal:0,answer:0}), /already submitted/)
  await db.query("UPDATE verified_game_runs SET started_at=now()-interval '10 seconds',last_answer_at=now()-interval '1 second' WHERE id=$1",[run])
  await act('answer',{ordinal:1,answer:1})
  const { result } = await act('finish')
  assert.equal(result.tokens,10)
  assert.equal(result.xp,5)
  assert.deepEqual((await act('finish')).result,result)
  assert.deepEqual(await scalar('SELECT tokens, games_played,correct_answers_count,questions_answered_count FROM users WHERE id=$1',[id]),{ tokens:110,games_played:1,correct_answers_count:1,questions_answered_count:2 })
  await assert.rejects(act('answer',{ordinal:2,answer:1}), /Game ended/)
})

test('game settlement applies milestones, evolution and clan progress once, with lifetime cap', async () => {
  const id = await economyUser('Milestones')
  const { id: clan } = await scalar('INSERT INTO clans DEFAULT VALUES RETURNING id')
  const { id: tournament } = await scalar("INSERT INTO tournaments(status,start_time,end_time) VALUES('active',now()-interval '1 day',now()+interval '1 day') RETURNING id")
  await db.query('INSERT INTO tournament_clans(tournament_id,clan_id) VALUES($1,$2)',[tournament,clan])
  await db.query("UPDATE users SET level=9,xp=898,clan_id=$2,pinned_boom='Owned',booms='{\"Owned\":1}',discover_tokens_earned=4997 WHERE id=$1",[id,clan])
  const run = randomUUID()
  const act = (action,details={}) => scalar('SELECT apply_boomkit_game_action($1,$2,$3,$4) AS result',[id,run,action,details])
  await act('start',{duration:60,questions:[{key:'known',correct:1}]})
  await act('answer',{ordinal:0,answer:1})
  await db.query("UPDATE verified_game_runs SET started_at=now()-interval '10 seconds' WHERE id=$1",[run])
  const details = { milestones:[{level:10,name:'Milestone Boom'}] }
  assert.equal((await act('finish',details)).result.tokens,3)
  await act('finish',details)
  assert.deepEqual(await scalar('SELECT level,xp,booms,discover_tokens_earned FROM users WHERE id=$1',[id]),{level:10,xp:3,booms:{Owned:1,'Milestone Boom':1},discover_tokens_earned:5000})
  assert.equal((await scalar('SELECT xp FROM clans WHERE id=$1',[clan])).xp,5)
  assert.equal((await scalar('SELECT score FROM tournament_clans WHERE clan_id=$1',[clan])).score,10)
  assert.equal((await scalar("SELECT xp FROM user_boom_evolution WHERE username='Milestones'")).xp,5)
  assert.equal((await scalar("SELECT has_table_privilege('anon','tournament_clans','UPDATE') AS writable")).writable,false)
})
test('chat reactions preserve other participants and retries are idempotent', async () => {
  const { id } = await scalar('INSERT INTO chat_messages DEFAULT VALUES RETURNING id')
  const react = (name, active) => scalar("SELECT set_boomkit_chat_reaction($1,$2,'test',$3) AS reactions", [id, name, active])
  await react('Alice', true)
  await react('Bob', true)
  assert.deepEqual((await react('Bob', true)).reactions, { test: ['Alice', 'Bob'] })
  assert.deepEqual((await react('Alice', false)).reactions, { test: ['Bob'] })
  assert.deepEqual((await react('Bob', false)).reactions, {})
  const privileges = await scalar("SELECT has_table_privilege('anon','chat_messages','UPDATE') AS writable, has_function_privilege('anon','set_boomkit_chat_reaction(text,text,text,boolean)','EXECUTE') AS executable")
  assert.deepEqual(privileges, { writable: false, executable: false })
})
async function register(name, key) {
  return scalar(`SELECT register_boomkit_user($1, $2, 18, '', $3, $4, '127.0.0.1', null) AS result`, [name, `${name}@example.test`, key, hash])
}

test('registration atomically consumes one key and persists credentials', async () => {
  await db.exec("INSERT INTO access_keys(key) VALUES('one'), ('two')")
  const { result: user } = await register('Alice', 'one')
  assert.equal(user.username, 'Alice')
  assert.equal((await scalar('SELECT password_hash FROM user_secrets WHERE user_id=$1', [user.id])).password_hash, hash)
  await assert.rejects(register('Bob', 'one'), /already used/)
  await assert.rejects(register('alice', 'two'), /unique constraint/)
  assert.equal((await scalar("SELECT is_used FROM access_keys WHERE key='two'")).is_used, false)
})

test('rate limiter blocks attempt six without extending an existing block', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await scalar("SELECT consume_auth_attempt('test') AS result")).result.allowed, true)
  assert.equal((await scalar("SELECT consume_auth_attempt('test') AS result")).result.allowed, false)
  const before = await scalar("SELECT reset_time FROM rate_limits WHERE ip='test'")
  await scalar("SELECT consume_auth_attempt('test') AS result")
  assert.deepEqual(await scalar("SELECT reset_time FROM rate_limits WHERE ip='test'"), before)
  await db.exec("UPDATE rate_limits SET reset_time=now()-interval '1 second' WHERE ip='test'")
  assert.equal((await scalar("SELECT consume_auth_attempt('test') AS result")).result.allowed, true)
})

test('payment retries grant once and retain both tokens and the Plus booster', async () => {
  const { id } = await scalar("SELECT id FROM users WHERE username='Alice'")
  const sql = "SELECT fulfill_boomkit_purchase('orders:123', $1, 'boomkit-plus', 10000, 'luck-charm-2x-1h', true) AS result"
  assert.equal((await scalar(sql, [id])).result.duplicate, false)
  assert.equal((await scalar(sql, [id])).result.duplicate, true)
  const user = await scalar('SELECT tokens, inventory, is_plus_user FROM users WHERE id=$1', [id])
  assert.equal(user.tokens, 10000)
  assert.deepEqual(user.inventory, [{ id: 'luck-charm-2x-1h', quantity: 1 }])
  assert.equal(user.is_plus_user, true)
})

test('booster activation rejects a second global boost without consuming inventory', async () => {
  const { id } = await scalar("SELECT id FROM users WHERE username='Alice'")
  await scalar("SELECT activate_boomkit_boost($1, 'luck-charm-2x-1h')", [id])
  await db.exec(`UPDATE users SET inventory='[{"id":"luck-charm-2x-1h","quantity":1}]' WHERE username='Alice'`)
  await assert.rejects(scalar("SELECT activate_boomkit_boost($1, 'luck-charm-2x-1h')", [id]), /Another global/)
  assert.equal((await scalar('SELECT inventory FROM users WHERE id=$1', [id])).inventory[0].quantity, 1)
})

test('season claims are once-only; failed fulfillment does not burn the claim', async () => {
  const { id } = await scalar("SELECT id FROM users WHERE username='Alice'")
  const { id: seasonId } = await scalar("INSERT INTO seasons(is_active,start_date,end_date) VALUES(true,now()-interval '1 day',now()+interval '1 day') RETURNING id")
  const { id: rewardId } = await scalar("INSERT INTO season_rewards(season_id,tier,xp_required,reward_type,reward_value,is_premium) VALUES($1,1,0,'tokens','500',false) RETURNING id", [seasonId])
  await scalar('SELECT claim_boomkit_season_reward($1,$2)', [id, rewardId])
  await assert.rejects(scalar('SELECT claim_boomkit_season_reward($1,$2)', [id, rewardId]), /already claimed/)
  const { id: badId } = await scalar("INSERT INTO season_rewards(season_id,tier,xp_required,reward_type,reward_value,is_premium) VALUES($1,2,0,'unknown','500',false) RETURNING id", [seasonId])
  await assert.rejects(scalar('SELECT claim_boomkit_season_reward($1,$2)', [id, badId]), /Unsupported/)
  assert.equal((await scalar('SELECT count(*)::int AS count FROM claimed_season_rewards WHERE reward_id=$1', [badId])).count, 0)
})

test('Plus days have an expiry and never grant tester or moderator privileges', async () => {
  const { id } = await scalar("SELECT id FROM users WHERE username='Alice'")
  const { id: season } = await scalar('SELECT id FROM seasons LIMIT 1')
  const { id: reward } = await scalar("INSERT INTO season_rewards(season_id,tier,xp_required,reward_type,reward_value,is_premium) VALUES($1,3,0,'plus_days','7',false) RETURNING id", [season])
  await scalar('SELECT claim_boomkit_season_reward($1,$2)', [id, reward])
  const user = await scalar('SELECT role, plus_reward_expires_at > now() AS active FROM users WHERE id=$1', [id])
  assert.equal(user.role, 'player')
  assert.equal(user.active, true)
})

test('anonymous users cannot execute privileged RPCs through inherited PUBLIC grants', async () => {
  const signatures = ['consume_auth_attempt(text)', 'register_boomkit_user(text,text,integer,text,text,text,text,text)',
    'fulfill_boomkit_purchase(text,text,text,integer,text,boolean)', 'activate_boomkit_boost(text,text)', 'claim_boomkit_season_reward(text,uuid)']
  for (const signature of signatures) {
    assert.equal((await scalar("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed", [signature])).allowed, false)
    assert.equal((await scalar("SELECT has_function_privilege('service_role',$1,'EXECUTE') AS allowed", [signature])).allowed, true)
  }
})

test('transfers reject fractional, negative, missing and non-finite amounts', async () => {
  await db.exec("INSERT INTO access_keys(key) VALUES('bob-key')")
  await register('Bob', 'bob-key')
  for (const amount of [-1, 0, 0.5, null, 'NaN', 'Infinity']) {
    await assert.rejects(scalar('SELECT transfer_tokens($1,$2,$3)', ['Alice', 'Bob', amount]), /Invalid transfer/)
  }
  await assert.rejects(scalar("SELECT transfer_tokens('Missing','Bob',1)"), /User unavailable/)
  const { tokens } = await scalar("SELECT tokens FROM users WHERE username='Alice'")
  await scalar("SELECT transfer_tokens('Alice','Bob',1000)")
  assert.equal((await scalar("SELECT tokens FROM users WHERE username='Alice'")).tokens, tokens - 1000)
  assert.equal((await scalar("SELECT tokens FROM users WHERE username='Bob'")).tokens, 1000)
})

test('trade cannot overdraft or use negative items, and accepted trades cannot replay', async () => {
  const alice = await scalar("SELECT id FROM users WHERE username='Alice'")
  const bob = await scalar("SELECT id FROM users WHERE username='Bob'")
  await db.exec(`UPDATE users SET booms='{"Dragon":2}' WHERE username='Alice'`)
  const { id } = await scalar(`INSERT INTO trades(sender_id,receiver_id,sender_tokens,receiver_tokens,sender_booms,receiver_booms,status)
    VALUES($1,$2,999999,0,'{"Dragon":1}','{}','pending') RETURNING id`, [alice.id,bob.id])
  await assert.rejects(scalar('SELECT accept_trade($1)', [id]), /insufficient trade tokens/)
  await db.query(`UPDATE trades SET sender_tokens=0, sender_booms='{"Dragon":-1}' WHERE id=$1`, [id])
  await assert.rejects(scalar('SELECT accept_trade($1)', [id]), /Invalid sender boom/)
  await db.query(`UPDATE trades SET sender_booms='{"Dragon":1}', receiver_tokens=100 WHERE id=$1`, [id])
  await scalar('SELECT accept_trade($1)', [id])
  await assert.rejects(scalar('SELECT accept_trade($1)', [id]), /not pending/)
  assert.equal((await scalar("SELECT booms FROM users WHERE username='Bob'")).booms.Dragon, 1)
})

test('auction bids reserve funds, claims pay once and no longer double-charge', async () => {
  const alice = await scalar("SELECT id FROM users WHERE username='Alice'")
  const bob = await scalar("SELECT id FROM users WHERE username='Bob'")
  const { result: auction } = await scalar("SELECT to_jsonb(create_auction('Dragon',50,1,$1)) AS result", [alice.id])
  await assert.rejects(scalar('SELECT reclaim_auction_item($1)', [auction.id]), /Only ended/)
  await assert.rejects(scalar('SELECT place_bid($1,100,$2,$3)', [auction.id,'Alice',alice.id]), /Invalid bidder/)
  const { tokens: before } = await scalar('SELECT tokens FROM users WHERE id=$1', [bob.id])
  await scalar('SELECT place_bid($1,100,$2,$3)', [auction.id,'Bob',bob.id])
  await scalar('SELECT place_bid($1,150,$2,$3)', [auction.id,'Bob',bob.id])
  assert.equal((await scalar('SELECT tokens FROM users WHERE id=$1', [bob.id])).tokens, before - 150)
  await db.query("UPDATE auction_items SET ends_at=now()-interval '1 second' WHERE id=$1", [auction.id])
  await assert.rejects(scalar('SELECT reclaim_auction_item($1)', [auction.id]), /Only ended/)
  await scalar('SELECT claim_auction($1,$2)', [auction.id,bob.id])
  await assert.rejects(scalar('SELECT claim_auction($1,$2)', [auction.id,bob.id]), /unavailable/)
  assert.equal((await scalar('SELECT tokens FROM users WHERE id=$1', [bob.id])).tokens, before - 150)
  assert.equal((await scalar('SELECT booms FROM users WHERE id=$1', [bob.id])).booms.Dragon, 2)
})

test('market RPCs and direct user, trade and DM writes are unavailable to browser roles', async () => {
  assert.equal((await scalar("SELECT has_function_privilege('anon','accept_trade(uuid)','EXECUTE') AS allowed")).allowed, false)
  assert.equal((await scalar("SELECT has_table_privilege('anon','users','UPDATE') AS allowed")).allowed, false)
  assert.equal((await scalar("SELECT has_table_privilege('anon','direct_messages','SELECT') AS allowed")).allowed, false)
})
