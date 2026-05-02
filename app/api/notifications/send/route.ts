import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export type NotificationCategory = 'new_order' | 'payment_recorded' | 'order_delivered'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, title, body } = await req.json() as {
    category: NotificationCategory
    title: string
    body: string
  }

  const db = supabase as any

  // Get all subscriptions for users who have this category enabled
  const { data: prefs } = await db
    .from('notification_preferences')
    .select('user_id')
    .eq(category, true)

  if (!prefs || prefs.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const userIds = prefs.map((p: any) => p.user_id)

  const { data: subs } = await db
    .from('push_subscriptions')
    .select('subscription')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const payload = JSON.stringify({ title, body })

  const results = await Promise.allSettled(
    subs.map((s: any) => webpush.sendNotification(s.subscription, payload))
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, sent })
}
