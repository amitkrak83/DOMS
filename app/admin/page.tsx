import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { PageHeader } from '@/components/page-header'
import { UsersPanel } from '@/components/admin/users-panel'
import { AllowedEmailsPanel } from '@/components/admin/allowed-emails-panel'
import { SettingsPanel } from '@/components/admin/settings-panel'
import { RequestsPanel } from '@/components/admin/requests-panel'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { AuditLogPanel } from '@/components/admin/audit-log-panel'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'activity' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) redirect('/dashboard')
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''

  const db = supabase as any
  const [{ data: profiles }, { data: allowedEmails }, { data: settings }, { data: accessRequests }, { data: auditLogs }, { data: notifPrefs }] = await Promise.all([
    supabase.from('profiles').select('id, email, is_admin, created_at').order('created_at', { ascending: false }),
    supabase.from('allowed_emails').select('email, added_at').order('added_at', { ascending: false }),
    supabase.from('app_settings').select('key, value'),
    supabase.from('access_requests').select('id, email, requested_at, status').order('requested_at', { ascending: false }),
    db.from('audit_log').select('id, table_name, operation, old_data, new_data, user_email, user_name, created_at').order('created_at', { ascending: false }).limit(200),
    db.from('notification_preferences').select('user_id, new_order, payment_recorded, order_delivered'),
  ])

  const activeEmails = new Set((profiles ?? []).map(p => p.email))
  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Admin Panel" back>
        <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">Super Admin</span>
      </PageHeader>

      <AdminTabs activeTab={tab} />

      <div className="px-4 py-4">
        {tab === 'requests' && (
          <RequestsPanel initialRequests={accessRequests ?? []} />
        )}
        {tab === 'users' && (
          <UsersPanel
            initialProfiles={profiles ?? []}
            superAdminEmail={superAdminEmail}
            initialNotifPrefs={Object.fromEntries((notifPrefs ?? []).map((p: any) => [p.user_id, p]))}
          />
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
        {tab === 'activity' && (
          <AuditLogPanel logs={auditLogs ?? []} />
        )}
      </div>
    </div>
  )
}
