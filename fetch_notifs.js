const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from("notifications").select("id, message, actor:profiles!actor_id(id, username, name, avatar_url)").limit(3);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
