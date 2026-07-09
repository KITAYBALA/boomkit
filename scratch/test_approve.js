const { SignJWT } = require('jose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-only-use-for-local-testing-purposes-1234567890');
  
  // We need to act as an owner to bypass roles, or we can use the exact same role as the user
  // Let's assume we are "system"
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Find 'system'
  const { data: owner } = await sb.from('users').select('id, username, role, is_owner').eq('username', 'system').single();
  
  // Find a pending user
  const { data: pending } = await sb.from('users').select('*').eq('status', 'pending').limit(1).single();
  
  if (!pending) {
    console.log("No pending users found!");
    // Create one for testing
    const pendingId = crypto.randomUUID();
    await sb.from('users').insert({
      id: pendingId,
      username: 'TestPendingUser',
      status: 'pending',
      role: 'player',
      age: 20,
      email: 'testpending@boomkit.local'
    });
    console.log("Created test pending user:", pendingId);
    pending = { id: pendingId, username: 'TestPendingUser', status: 'pending', role: 'player' };
  }
  
  console.log("Target Pending User:", pending.username, pending.id);

  // Generate session token
  const token = await new SignJWT({ 
    userId: owner.id,
    role: owner.role, 
    isOwner: owner.is_owner 
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);

  // Create updates payload identical to frontend
  const updates = {
    username: pending.username,
    tokens: pending.tokens || 0,
    boom_score: pending.boom_score || 0,
    role: pending.role || 'player',
    status: "approved",
    is_banned: pending.is_banned || false,
    is_muted: pending.is_muted || false,
    mute_expiry: pending.mute_expiry || null,
    ban_expiry: pending.ban_expiry || null,
    ban_reason: pending.ban_reason || null,
    banner_color: pending.banner_color || "from-purple-600 to-pink-600",
    packs_opened: pending.packs_opened || 0,
    badges: pending.badges || [],
    packs: pending.packs || [],
    booms: pending.booms || {},
    daily_tokens: pending.daily_tokens || 0,
    total_value: pending.total_value || 0,
    profile_picture: pending.profile_picture || "🎮",
    is_owner: pending.is_owner || false,
    is_plus_user: pending.is_plus_user || false,
    last_daily_spin: pending.last_daily_spin || "",
    name_color: pending.name_color || "text-white",
    last_seen: pending.last_seen || Date.now(),
    reason: pending.reason || "",
  };

  if (pending.email) updates.email = pending.email;

  // Make the API request locally
  const response = await fetch("http://localhost:3000/api/users/update", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": `session_token=${token}`
    },
    body: JSON.stringify({ targetUserId: pending.id, updates }),
  });

  const data = await response.json();
  console.log("API Response Status:", response.status);
  console.log("API Response Body:", data);
}

run();
