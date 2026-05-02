'use client'

import { useRouter } from 'next/navigation'

const TABS = [
  { id: 'activity',  label: 'Activity'  },
  { id: 'users',     label: 'Users'     },
  { id: 'requests',  label: 'Requests'  },
  { id: 'access',    label: 'Access'    },
  { id: 'settings',  label: 'Settings'  },
] as const

export function AdminTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter()
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(`/admin?tab=${tab.id}`)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
