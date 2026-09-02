'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError('Email ou senha incorretos. Verifique suas credenciais.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div 
      className="min-h-svh flex flex-col items-center justify-center"
      style={{ background: 'var(--gray-900)' }}
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(196, 30, 42, 0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm px-6 py-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2"
            style={{ background: 'var(--red)' }}
          >
            SE
          </div>
          <h1 
            className="text-heading-3"
            style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
          >
            Semana da Esperança
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Painel Administrativo
          </p>
        </div>

        {/* Form card */}
        <div 
          className="rounded-2xl p-6"
          style={{ 
            background: 'var(--gray-800)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
            <div className="form-group">
              <label 
                htmlFor="email"
                className="form-label"
                style={{ color: 'var(--gray-400)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{ 
                  background: 'var(--gray-900)',
                  color: 'var(--white)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            <div className="form-group">
              <label 
                htmlFor="password"
                className="form-label"
                style={{ color: 'var(--gray-400)' }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ 
                  background: 'var(--gray-900)',
                  color: 'var(--white)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {error && (
              <div 
                className="p-3 rounded-lg text-small"
                role="alert"
                style={{ 
                  background: 'var(--red-muted)',
                  color: 'var(--red)',
                  border: '1px solid rgba(196,30,42,0.3)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  <span>Entrando...</span>
                </div>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p 
          className="text-center text-caption mt-6"
          style={{ color: 'var(--gray-600)' }}
        >
          Esqueceu sua senha? Contate o administrador.
        </p>
      </motion.div>
    </div>
  )
}
