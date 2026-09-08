import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import UsersClient from '@/components/admin/UsersClient'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Acessos | Admin' }

export default async function UsersPage() {
  const supabase = await createClient()

  // Protect page for super_admin and admin_general only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin_general')) {
    redirect('/admin')
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch active churches for the dropdown
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, cities(name)')
    .eq('status', 'active')
    .order('name')

  // Fetch campaigns for the dropdown
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status')
    .order('created_at', { ascending: false })

  return (
    <UsersClient
      initialUsers={users || []}
      churches={churches || []}
      campaigns={campaigns || []}
      currentUserRole={profile.role}
    />
  )
}
