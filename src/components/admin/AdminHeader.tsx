'use client'

import Link from 'next/link'
import type { UserProfile } from '@/types/database'

interface AdminHeaderProps {
  profile: UserProfile
}

export default function AdminHeader({ profile }: AdminHeaderProps) {
  return (
    <header 
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ 
        background: 'var(--white)',
        borderColor: 'var(--gray-100)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="text-small flex items-center gap-1"
          style={{ color: 'var(--gray-500)' }}
        >
          <span>🌐</span>
          Ver site
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div 
          className="text-small text-right"
          style={{ color: 'var(--gray-600)' }}
        >
          {profile.full_name}
        </div>
      </div>
    </header>
  )
}
