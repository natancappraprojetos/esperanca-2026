import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    redirect('/login?error=unauthorized')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar profile={profile} />
      <div className="admin-content" style={{ flex: 1 }}>
        <AdminHeader profile={profile} />
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
