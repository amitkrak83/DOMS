import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { PageHeader } from '@/components/page-header'
import { NotificationSettings } from '@/components/notifications/notification-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Settings" back />

      <div className="px-4 py-4 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notifications</p>
        <NotificationSettings />
      </div>
    </div>
  )
}
