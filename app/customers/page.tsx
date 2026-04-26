import { createClient } from '@/lib/supabase-server'
import { CustomersList } from '@/components/customers/customers-list'
import { PageHeader } from '@/components/page-header'
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
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Customers">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{customers.length}</span>
        </PageHeader>
      </div>

      <CustomersList initialCustomers={customers} />
      <AddCustomerDialog />
    </div>
  )
}
