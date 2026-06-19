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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = '1df9b1ed-397a-479b-bd4a-030fb8d2f6a6'; // sample user ID from test-db output
  
  // Fetch first
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log("Original profile:", profile);

  // Try updating with anon client (no auth headers set yet, will fail if RLS is active)
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ bio: 'Testing bio update ' + new Date().toISOString() })
    .eq('id', userId)
    .select();

  console.log("Anon update result:", updateData, "Error:", updateError);
}

run();
