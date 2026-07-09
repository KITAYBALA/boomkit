const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking users.inventory column...");
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('inventory')
    .limit(1);

  if (userErr) {
    console.log("Error querying inventory column (likely does not exist):", userErr.message);
  } else {
    console.log("inventory column exists! Sample data:", userData);
  }

  console.log("Checking active_boosts table...");
  const { data: boostData, error: boostErr } = await supabase
    .from('active_boosts')
    .select('*')
    .limit(1);

  if (boostErr) {
    console.log("Error querying active_boosts table (likely does not exist):", boostErr.message);
  } else {
    console.log("active_boosts table exists! Sample data:", boostData);
  }

  console.log("Checking rate_limits table...");
  const { data: rateData, error: rateErr } = await supabase
    .from('rate_limits')
    .select('*')
    .limit(1);

  if (rateErr) {
    console.log("Error querying rate_limits table (likely does not exist):", rateErr.message);
  } else {
    console.log("rate_limits table exists! Sample data:", rateData);
  }

  console.log("Checking claimed_season_rewards table...");
  const { data: claimData, error: claimErr } = await supabase
    .from('claimed_season_rewards')
    .select('*')
    .limit(1);

  if (claimErr) {
    console.log("Error querying claimed_season_rewards table (likely does not exist):", claimErr.message);
  } else {
    console.log("claimed_season_rewards table exists! Sample data:", claimData);
  }
}

run();
