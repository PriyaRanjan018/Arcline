async function run() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('entries').select('*').limit(1);
  if (error) console.log(error);
  else console.log(data);
}
run();
