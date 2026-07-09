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
  console.log("Listing users in Supabase...");
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, is_plus_user');

  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Found users count:", data.length);
    console.log("Users:", data);
  }
}

run();
