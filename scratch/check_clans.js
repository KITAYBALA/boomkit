const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClans() {
  try {
    const { data, error } = await supabase.from('clans').select('*').limit(1);
    if (error) {
      console.log("Error querying clans:", error.message);
    } else {
      console.log("Clans table is present, data:", data);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

checkClans();
