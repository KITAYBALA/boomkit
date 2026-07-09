const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: seasons, error: sErr } = await supabase.from('seasons').select('*').eq('is_active', true);
  console.log("Active seasons:", seasons);

  const { data: rewards, error: rErr } = await supabase.from('season_rewards').select('*');
  console.log("All season rewards:", rewards);
}

run();
