import { createClient } from '@/lib/supabase-server'
import { CustomersList } from '@/components/customers/customers-list'
import { SidebarMenu } from '@/components/sidebar-menu'
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog'

async function getCustomers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, mobile, address, created_at')
    .order('name')
  return data ?? []
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3">
        <SidebarMenu />
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{customers.length}</span>
      </div>

      <CustomersList initialCustomers={customers} />
      <AddCustomerDialog />
    </div>
  )
}
