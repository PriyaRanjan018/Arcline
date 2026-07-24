async function run() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try to insert a reaction for user 1
  const u1 = "e487b9ff-8cd6-44a8-9405-1629b4f46890";
  const u2 = "dca7261e-d86d-4755-937e-22281b7d513a";
  const entry_id = "f649bbec-2621-4fa3-9366-231a478b271d"; // Need a valid entry_id, let me just fetch one first
  
  const {data: entries} = await supabase.from('entries').select('id').limit(1);
  const e_id = entries[0].id;
  
  console.log("Entry ID:", e_id);
  
  const res1 = await supabase.from('reactions').upsert({ entry_id: e_id, user_id: u1, type: 'FEEL_THIS' }, {onConflict: 'entry_id,user_id,type'});
  console.log("Res1:", res1.error);
  
  const res2 = await supabase.from('reactions').upsert({ entry_id: e_id, user_id: u2, type: 'FEEL_THIS' }, {onConflict: 'entry_id,user_id,type'});
  console.log("Res2:", res2.error);
  
  const {data: all} = await supabase.from('reactions').select('*').eq('entry_id', e_id).eq('type', 'FEEL_THIS');
  console.log("All reactions:", all);
}
run();
