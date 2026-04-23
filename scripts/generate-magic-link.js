const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateLink() {
  const email = 'testuser123@example.com';
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (error) {
    console.error('Error generating link:', error);
    process.exit(1);
  }

  // Rewrite the link to localhost instead of the remote site
  let url = data.properties.action_link;
  url = url.replace(process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000');
  
  console.log(url);
}

generateLink();
