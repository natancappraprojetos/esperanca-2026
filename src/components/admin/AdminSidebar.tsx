'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserProfile } from '@/types/database'

interface AdminSidebarProps {
  profile: UserProfile
}

const navItems = [
  { 
    section: 'Principal',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', roles: ['super_admin', 'admin_general', 'church_admin'] },
    ]
  },
  {
    section: 'Campanha',
    items: [
      { href: '/admin/campanhas', label: 'Campanhas', icon: '🎯', roles: ['super_admin', 'admin_general'] },
      { href: '/admin/igrejas', label: 'Igrejas', icon: '🏛️', roles: ['super_admin', 'admin_general'] },
      { href: '/admin/pastores', label: 'Pastores', icon: '👤', roles: ['super_admin', 'admin_general'] },
      { href: '/admin/materiais', label: 'Materiais', icon: '📖', roles: ['super_admin', 'admin_general'] },
    ]
  },
  {
    section: 'Leads',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: '📋', roles: ['super_admin', 'admin_general', 'church_admin'] },
      { href: '/admin/relatorios', label: 'Relatórios', icon: '📈', roles: ['super_admin', 'admin_general', 'church_admin'] },
    ]
]

export default function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()

  const filteredNav = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.roles.includes(profile.role)
    )
  })).filter(section => section.items.length > 0)

  return (
    <aside className="admin-sidebar" style={{ overflowY: 'auto' }}>
      {/* Logo */}
      <div 
        className="p-4 border-b flex items-center gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: 'var(--red)' }}
        >
          SE
        </div>
        <div className="flex flex-col overflow-hidden">
          <span 
            className="text-small font-semibold truncate"
            style={{ color: 'var(--white)' }}
          >
            Semana da Esperança
          </span>
          <span 
            className="text-caption"
            style={{ color: 'var(--gray-500)' }}
          >
            Painel Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1" aria-label="Navegação principal">
        {filteredNav.map(section => (
          <div key={section.section} className="flex flex-col gap-1 mt-4 first:mt-0">
            <p 
              className="text-caption px-3 mb-1"
              style={{ 
                color: 'var(--gray-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              {section.section}
            </p>
            {section.items.map(item => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '1rem' }} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div 
        className="p-4 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--white)' }}
          >
            {profile.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <span 
              className="text-small font-medium truncate"
              style={{ color: 'var(--white)' }}
            >
              {profile.full_name}
            </span>
            <span 
              className="text-caption truncate"
              style={{ color: 'var(--gray-500)' }}
            >
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </div>
        <Link
          href="/admin/logout"
          className="admin-nav-item mt-2 text-caption"
          style={{ color: 'var(--gray-600)', padding: '0.5rem' }}
        >
          <span>🚪</span>
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  )
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_general: 'Admin Geral',
    church_admin: 'Pastor',
    viewer: 'Visualizador',
  }
  return labels[role] || role
}
