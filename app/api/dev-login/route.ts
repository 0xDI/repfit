import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // ONLY ALLOW IN DEVELOPMENT
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'test@example.com';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate HTML that immediately redirects to the magic link
  const link = data.properties?.action_link;
  
  if (!link) {
    return NextResponse.json({ error: 'No link generated' }, { status: 500 });
  }

  // We should replace the production site URL with localhost if needed
  const localLink = link.replace(process.env.NEXT_PUBLIC_SITE_URL || 'https://repfitapp.com', 'http://localhost:3000');

  return new NextResponse(`
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${localLink}">
      </head>
      <body>
        <p>Redirecting to login...</p>
        <a href="${localLink}">Click here if not redirected</a>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
