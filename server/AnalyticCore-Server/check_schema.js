const fs = require('fs');
const env = fs.readFileSync('/home/Suhaif/Downloads/insightai_clone/Analytic-Core/server/.env', 'utf8');
const url = env.match(/SUPABASE_URL=(.*)/)[1];
const key = env.match(/SUPABASE_KEY=(.*)/)[1];
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);
async function run() {
  const { data, error } = await supabase.from('users').select('id, name, organization_id').limit(5);
  console.log('Users:', data, error);
}
run();
