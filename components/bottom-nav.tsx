'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, BookOpen, Users } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/ledger', label: 'Khata', icon: BookOpen },
]

type NavLinkProps = { href: string; label: string; icon: React.ElementType; active: boolean }

const NavLink = memo(function NavLink({ href, label, icon: Icon, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors ${
        active ? 'text-blue-600' : 'text-gray-500'
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-xs font-semibold ${active ? 'text-blue-600' : 'text-gray-500'}`}>
        {label}
      </span>
      {active && <div className="h-0.5 w-8 bg-blue-600 rounded-full" />}
    </Link>
  )
})

export function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-50">
      <div className="max-w-2xl mx-auto flex">
        {links.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} active={pathname === href || pathname.startsWith(href + '/')} />
        ))}
      </div>
    </nav>
  )
}
