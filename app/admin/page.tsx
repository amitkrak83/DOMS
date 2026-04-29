import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { BackButton } from '@/components/ui/back-button'
import { UsersPanel } from '@/components/admin/users-panel'
import { AllowedEmailsPanel } from '@/components/admin/allowed-emails-panel'
import { SettingsPanel } from '@/components/admin/settings-panel'
import { AdminTabs } from '@/components/admin/admin-tabs'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'users' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) redirect('/dashboard')
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''

  const [{ data: profiles }, { data: allowedEmails }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('id, email, is_admin, created_at').order('created_at', { ascending: false }),
    supabase.from('allowed_emails').select('email, added_at').order('added_at', { ascending: false }),
    supabase.from('app_settings').select('key, value'),
  ])

  const activeEmails = new Set((profiles ?? []).map(p => p.email))
  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-bold text-gray-900 flex-1">Admin Panel</h1>
        <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
          Super Admin
        </span>
      </div>

      <AdminTabs activeTab={tab} />

      <div className="px-4 py-4">
        {tab === 'users' && (
          <UsersPanel initialProfiles={profiles ?? []} superAdminEmail={superAdminEmail} />
        )}
        {tab === 'access' && (
          <AllowedEmailsPanel
            initialEmails={allowedEmails ?? []}
            activeEmails={activeEmails}
            superAdminEmail={superAdminEmail}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            initialSettings={{
              upi_id: settingsMap['upi_id'] ?? process.env.NEXT_PUBLIC_UPI_ID ?? '',
              merchant_name: settingsMap['merchant_name'] ?? process.env.NEXT_PUBLIC_MERCHANT_NAME ?? '',
            }}
          />
        )}
      </div>
    </div>
  )
}
