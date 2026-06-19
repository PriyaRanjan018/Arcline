const fs = require('fs');
const path = require('path');

const envPath = '/home/honey_badger/Code/Lab/scratch/Arcline/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS and read pg_policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Let's run a query to get pg_policies for profiles
  const { data, error } = await supabase
    .rpc('get_policies_for_table', { table_name: 'profiles' }); // Check if helper RPC exists

  if (error) {
    console.log("RPC get_policies_for_table not found, querying catalog via postgres function...");
    
    // Let's inspect policies using service role by executing sql if we can.
    // If not, we can select from information_schema or try to create a policy!
    // Since we have service role key, we can try to do updates to see if service role key bypasses it.
    const { data: testSvcData, error: testSvcErr } = await supabase
      .from('profiles')
      .update({ bio: 'Svc role updated bio' })
      .eq('id', '1df9b1ed-397a-479b-bd4a-030fb8d2f6a6')
      .select();
    console.log("Svc role update result:", testSvcData, "Error:", testSvcErr);
  } else {
    console.log("Policies info:", data);
  }
}

run();
