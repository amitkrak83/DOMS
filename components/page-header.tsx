import { UserAvatar } from '@/components/auth/user-avatar'
import { BackButton } from '@/components/ui/back-button'

export function PageHeader({ title, children, back }: { title: string; children?: React.ReactNode; back?: boolean }) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3">
      {back && <BackButton />}
      <h1 className="text-xl font-bold text-gray-900 flex-1">{title}</h1>
      {children}
      <UserAvatar />
    </div>
  )
}
