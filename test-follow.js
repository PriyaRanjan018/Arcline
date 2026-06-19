const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.from('user_follows').insert({ follower_id: '123', following_id: '456' }).select();
  console.log('Result:', data);
  console.log('Error:', error);
}

test();
