import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const db = supabase as any

  const { data, error } = await db
    .from('audit_log')
    .select('id, table_name, operation, old_data, new_data, user_email, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ data, error })
}
