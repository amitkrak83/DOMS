import { createClient } from '@/lib/supabase-server'
import { Clock } from 'lucide-react'

type AuditEntry = {
  id: string
  table_name: string
  operation: string
  old_data: any
  new_data: any
  user_email: string | null
  user_name: string | null
  created_at: string
}

function typeLabel(type: string) {
  if (type === 'cash') return 'Cash'
  if (type === 'online') return 'Online'
  if (type === 'credit') return 'Udhar'
  return type
}

function describe(log: AuditEntry): string {
  const { table_name, operation, old_data, new_data } = log
  const who = log.user_name ?? log.user_email ?? 'Someone'

  if (table_name === 'orders') {
    if (operation === 'INSERT') return `${who} created this order`
    if (operation === 'DELETE') return `${who} deleted this order`
    if (operation === 'UPDATE') {
      if (old_data?.status !== new_data?.status) {
        const labels: Record<string, string> = { pending: 'Pending', delivered: 'Delivered' }
        return `${who} changed status: ${labels[old_data?.status] ?? old_data?.status} → ${labels[new_data?.status] ?? new_data?.status}`
      }
      if (old_data?.total_amount !== new_data?.total_amount)
        return `${who} updated amount: ₹${Number(old_data?.total_amount).toLocaleString('en-IN')} → ₹${Number(new_data?.total_amount).toLocaleString('en-IN')}`
      return `${who} updated this order`
    }
  }

  if (table_name === 'payments') {
    if (operation === 'INSERT')
      return `${who} recorded ${typeLabel(new_data?.payment_type)} payment of ₹${Number(new_data?.amount).toLocaleString('en-IN')}`
    if (operation === 'DELETE')
      return `${who} deleted ${typeLabel(old_data?.payment_type)} payment of ₹${Number(old_data?.amount).toLocaleString('en-IN')}`
    if (operation === 'UPDATE') {
      const parts: string[] = []
      if (old_data?.amount !== new_data?.amount)
        parts.push(`₹${Number(old_data?.amount).toLocaleString('en-IN')} → ₹${Number(new_data?.amount).toLocaleString('en-IN')}`)
      if (old_data?.payment_type !== new_data?.payment_type)
        parts.push(`${typeLabel(old_data?.payment_type)} → ${typeLabel(new_data?.payment_type)}`)
      return `${who} updated payment: ${parts.join(', ')}`
    }
  }

  return `${who} ${operation.toLowerCase()}d ${table_name}`
}

function operationColor(op: string) {
  if (op === 'INSERT') return 'bg-green-100 text-green-700'
  if (op === 'DELETE') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

function operationLabel(op: string) {
  if (op === 'INSERT') return 'Added'
  if (op === 'DELETE') return 'Deleted'
  return 'Edited'
}

export async function OrderActivity({ orderId }: { orderId: string }) {
  const supabase = await createClient()
  const db = supabase as any

  const [r1, r2, r3] = await Promise.all([
    db.from('audit_log').select('id, table_name, operation, old_data, new_data, user_email, user_name, created_at').eq('record_id', orderId),
    db.from('audit_log').select('id, table_name, operation, old_data, new_data, user_email, user_name, created_at').eq('table_name', 'payments').contains('new_data', { order_id: orderId }),
    db.from('audit_log').select('id, table_name, operation, old_data, new_data, user_email, user_name, created_at').eq('table_name', 'payments').contains('old_data', { order_id: orderId }),
  ])

  const { data: orderLogs } = r1
  const { data: newPayLogs } = r2
  const { data: oldPayLogs } = r3

  const seen = new Set<string>()
  const logs = [...(orderLogs ?? []), ...(newPayLogs ?? []), ...(oldPayLogs ?? [])]
    .filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)

  if (!logs || logs.length === 0) return null

  const IST = { timeZone: 'Asia/Kolkata' } as const

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-gray-400" />
        <p className="font-bold text-gray-900 text-sm">Activity</p>
      </div>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
              {i < logs.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${operationColor(log.operation)}`}>
                  {operationLabel(log.operation)}
                </span>
                <span className="text-sm text-gray-800 font-medium">{describe(log)}</span>
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block">
                {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...IST })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
