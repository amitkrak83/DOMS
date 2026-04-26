'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, ShoppingCart, Package, BookOpen, Users } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/ledger', label: 'Khata', icon: BookOpen },
  { href: '/customers', label: 'Customers', icon: Users },
]

export function SidebarMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 -ml-1 text-gray-500 hover:text-gray-800 active:scale-90 transition-transform"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-base">DOMS Menu</p>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3.5 px-5 py-4 font-bold text-sm transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Distributor Order Management</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
