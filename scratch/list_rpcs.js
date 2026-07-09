const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

async function run() {
  const res = await fetch(supabaseUrl + '/rest/v1/', {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  if (!res.ok) {
    console.error("Failed to fetch schema:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  const paths = Object.keys(data.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  console.log("Available RPC endpoints:");
  console.log(rpcs);
}

run();
