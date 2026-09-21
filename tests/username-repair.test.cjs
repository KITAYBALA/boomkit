const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const sql = readFileSync(resolve(__dirname, '../scripts/repair_duplicate_usernames.sql'), 'utf8')

async function fixture(biddersType = 'jsonb') {
  const db = new PGlite()
  await db.exec(`
    CREATE TABLE users(id text PRIMARY KEY,username text UNIQUE,tokens integer DEFAULT 100,booms jsonb DEFAULT '{"Owned":2}');
    INSERT INTO users(id,username) VALUES
      ('6388a2c4-af75-4652-8d63-f0321ff83ca8','CasePair'),
      ('b080a68e-c39d-477a-837f-0614fd9c1459','casepair'),
      ('ced4071c-1dda-476c-b0db-ce3ab7ef70ff','user123'),
      ('kept','User123');
    CREATE TABLE friends(user_username text,friend_username text);
    INSERT INTO friends VALUES ('CasePair','casepair'),('User123','user123');
    CREATE TABLE access_keys(used_by_username text);
    INSERT INTO access_keys VALUES ('casepair');
    CREATE TABLE clans(leader text);
    INSERT INTO clans VALUES ('CasePair');
    CREATE TABLE awards(username text REFERENCES users(username) ON UPDATE CASCADE);
    INSERT INTO awards VALUES ('user123');
    CREATE TABLE game_sessions(host_username text,players jsonb);
    INSERT INTO game_sessions VALUES ('CasePair','[{"username":"CasePair","score":7},{"username":"casepair","score":8},{"username":"User123","score":9}]');
    CREATE TABLE chat_messages(username text,message text,reactions jsonb);
    INSERT INTO chat_messages VALUES ('CasePair','CasePair','{"like":["CasePair","casepair","User123"]}');
    CREATE TABLE auction_items(seller text,top_bidder text,bidders ${biddersType});
  `)
  if (biddersType === 'jsonb') await db.exec(`INSERT INTO auction_items VALUES ('CasePair','casepair','["CasePair",{"username":"casepair","amount":50}]')`)
  else await db.exec(`INSERT INTO auction_items VALUES ('CasePair','casepair',ARRAY['CasePair','casepair'])`)
  return db
}

test('username repair preserves accounts and migrates exact-case references, JSON and cascading foreign keys', async () => {
  const db = await fixture()
  try {
    // The prepared-query protocol accepts exactly one top-level SQL statement.
    await db.query(sql)
    const rows = (await db.query('SELECT username,tokens,booms FROM users ORDER BY username')).rows
    assert.deepEqual(rows.map(r=>r.username), ['Player_6388','Player_b080','User123','User123_2'])
    assert.ok(rows.every(r=>r.tokens===100 && r.booms.Owned===2))
    assert.deepEqual((await db.query('SELECT * FROM friends ORDER BY user_username')).rows, [
      {user_username:'Player_6388',friend_username:'Player_b080'},
      {user_username:'User123',friend_username:'User123_2'},
    ])
    assert.equal((await db.query('SELECT * FROM access_keys')).rows[0].used_by_username,'Player_b080')
    assert.equal((await db.query('SELECT * FROM awards')).rows[0].username,'User123_2')
    const chat=(await db.query('SELECT * FROM chat_messages')).rows[0]
    assert.equal(chat.message,'CasePair')
    assert.deepEqual(chat.reactions,{like:['Player_6388','Player_b080','User123']})
    assert.equal((await db.query('SELECT * FROM game_sessions')).rows[0].players[1].username,'Player_b080')
    assert.deepEqual((await db.query('SELECT bidders FROM auction_items')).rows[0].bidders,['Player_6388',{username:'Player_b080',amount:50}])
    await db.exec('CREATE UNIQUE INDEX unique_names ON users(lower(username))')
    await db.exec(sql)
    assert.deepEqual((await db.query('SELECT username,tokens,booms FROM users ORDER BY username')).rows,rows)
  } finally { await db.close() }
})

test('username repair supports legacy text-array bidders', async () => {
  const db=await fixture('text[]')
  try {
    await db.exec(sql)
    assert.deepEqual((await db.query('SELECT bidders FROM auction_items')).rows[0].bidders,['Player_6388','Player_b080'])
  } finally { await db.close() }
})

test('single-statement repair tolerates a helper left by an incomplete earlier execution', async () => {
  const db=await fixture()
  try {
    await db.exec(`CREATE TEMP TABLE boomkit_name_repair(dummy text) ON COMMIT DROP;
      CREATE FUNCTION pg_temp.boomkit_rename_participants(doc jsonb,reaction_names boolean)
      RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'stale helper'; END $$;`)
    await db.query(sql)
    assert.equal((await db.query("SELECT username FROM users WHERE id='6388a2c4-af75-4652-8d63-f0321ff83ca8'")).rows[0].username,'Player_6388')
  } finally { await db.close() }
})

test('username repair rolls back rather than attaching orphan references to a replacement name', async () => {
  const db=await fixture()
  try {
    await db.exec("INSERT INTO friends VALUES('Player_b080','someone')")
    await assert.rejects(db.exec(sql), /already appears/)
    assert.equal((await db.query("SELECT username FROM users WHERE id='6388a2c4-af75-4652-8d63-f0321ff83ca8'")).rows[0].username,'CasePair')
  } finally { await db.close() }
})

test('username repair rolls back all earlier updates if a later schema check fails', async () => {
  const db=await fixture()
  try {
    await db.exec('ALTER TABLE game_sessions ALTER COLUMN players TYPE text USING players::text')
    await assert.rejects(db.exec(sql), /Unsupported type/)
    assert.equal((await db.query("SELECT username FROM users WHERE id='6388a2c4-af75-4652-8d63-f0321ff83ca8'")).rows[0].username,'CasePair')
    assert.equal((await db.query('SELECT leader FROM clans')).rows[0].leader,'CasePair')
  } finally { await db.close() }
})
