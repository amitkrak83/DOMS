import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()
  const db = supabase as any

  // Upsert subscription
  const { error } = await db.from('push_subscriptions').upsert({
    user_id: user.id,
    subscription,
  }, { onConflict: 'user_id, (subscription->>\'endpoint\')' })

  // Also ensure preferences row exists
  await db.from('notification_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  const db = supabase as any

  await db.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .filter('subscription->>endpoint', 'eq', endpoint)

  return NextResponse.json({ ok: true })
}
