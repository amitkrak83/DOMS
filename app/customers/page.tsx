import { createClient } from '@/lib/supabase-server'
import { CustomersList } from '@/components/customers/customers-list'
import { PageHeader } from '@/components/page-header'

async function getCustomers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, mobile, address')
    .order('name')
  return data ?? []
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Customers" />

      <CustomersList initialCustomers={customers} />
    </div>
  )
}
