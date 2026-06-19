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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Query all tables in public schema
  const { data, error } = await supabase.rpc('get_tables_info');
  if (error) {
    // Fallback: query supabase catalog if rpc doesn't exist
    console.log("RPC get_tables_info not found, trying raw queries...");
    
    // Let's try select from pg_tables
    const { data: tables, error: err2 } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    console.log("Projects table check:", err2 ? "Error" : "Success");

    // Let's inspect some other possible tables
    const potentialTables = ['profiles', 'projects', 'entries', 'reactions', 'comments', 'notifications', 'user_follows'];
    for (const table of potentialTables) {
      const { data: cols, error: err3 } = await supabase.from(table).select('*').limit(1);
      if (err3) {
        console.log(`Table ${table}: Not found / error:`, err3.message);
      } else {
        console.log(`Table ${table}: Found! Columns:`, cols.length > 0 ? Object.keys(cols[0]) : "Empty table");
      }
    }
  } else {
    console.log("Tables info:", data);
  }
}

run();
