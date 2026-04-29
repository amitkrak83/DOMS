import { createClient } from '@/lib/supabase-server'
import { SidebarMenu } from '@/components/sidebar-menu'
import { UserAvatar } from '@/components/auth/user-avatar'

export async function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()
    isAdmin = data?.is_admin ?? false
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3">
      <SidebarMenu isAdmin={isAdmin} />
      <h1 className="text-xl font-bold text-gray-900 flex-1">{title}</h1>
      {children}
      <UserAvatar />
    </div>
  )
}
