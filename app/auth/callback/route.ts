import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  // Check whitelist — fail-open if table doesn't exist yet (migration not run)
  const { data: allowed, error: allowedError } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', user.email!)
    .maybeSingle()

  if (!allowedError && !allowed) {
    await supabase.auth.signOut()
    const url = new URL('/no-access', request.url)
    url.searchParams.set('email', user.email!)
    return NextResponse.redirect(url)
  }

  // Upsert profile — don't override is_admin for non-superadmin rows
  const upsertData: { id: string; email: string; is_admin?: boolean } = {
    id: user.id,
    email: user.email!,
  }
  if (user.email === process.env.SUPER_ADMIN_EMAIL) upsertData.is_admin = true

  await supabase.from('profiles').upsert(upsertData, { onConflict: 'id' })

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
