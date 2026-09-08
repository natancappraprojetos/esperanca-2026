'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Plus, X, User as UserIcon } from 'lucide-react'

export default function UsersClient({ initialUsers, churches, campaigns, currentUserRole }: { initialUsers: any[], churches: any[], campaigns: any[], currentUserRole: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    id: '',
    full_name: '',
    email: '',
    password: '',
    role: 'church_admin',
    church_id: '',
    allowed_campaigns: [] as string[]
  })

  const filteredUsers = users
    .filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .filter(u => (roleFilter ? u.role === roleFilter : true))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const isEdit = !!form.id
      const url = isEdit ? `/api/admin/users/${form.id}` : '/api/admin/users'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      toast.success(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
      
      // Refresh local list
      if (isEdit) {
        setUsers(users.map(u => u.id === form.id ? { ...u, full_name: form.full_name, role: form.role, allowed_campaigns: form.allowed_campaigns } : u))
      } else {
        setUsers([{ ...data.user, status: 'active', created_at: new Date().toISOString() }, ...users])
      }
      
      setIsModalOpen(false)
      setForm({
        id: '',
        full_name: '',
        email: '',
        password: '',
        role: 'church_admin',
        church_id: '',
        allowed_campaigns: []
      })

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  function getRoleBadge(role: string) {
    if (role === 'super_admin') return <span className="badge bg-purple-100 text-purple-800">Super Admin</span>
    if (role === 'admin_general') return <span className="badge bg-blue-100 text-blue-800">Departamental</span>
    if (role === 'church_admin') return <span className="badge bg-green-100 text-green-800">Pastor</span>
    return <span className="badge bg-gray-100 text-gray-800">{role}</span>
  }

  function handleEdit(user: any) {
    setForm({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      church_id: user.pastors?.[0]?.church_id || '',
      allowed_campaigns: user.allowed_campaigns || []
    })
    setIsModalOpen(true)
  }

  function handleNew() {
    setForm({
      id: '',
      full_name: '',
      email: '',
      password: '',
      role: 'church_admin',
      church_id: '',
      allowed_campaigns: []
    })
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-heading-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}>
            Acessos & Usuários
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie quem tem acesso ao painel administrativo.
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleNew}>
          <Plus size={16} /> Novo Usuário
        </button>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          className="form-input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input max-w-[220px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Todos os perfis</option>
          <option value="admin_general">Departamental</option>
          <option value="church_admin">Pastor</option>
        </select>
      </motion.div>

      {/* Tabela */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id}>
                    <td>
                      {user.status === 'active' ? (
                        <span className="badge badge-green">Ativo</span>
                      ) : (
                        <span className="badge badge-gray">Inativo</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <UserIcon size={16} />
                        </div>
                        {user.full_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      {currentUserRole === 'super_admin' ? (
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-small"
                          style={{ color: 'var(--red)' }}
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-caption text-gray-400">Restrito</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Criar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-lg w-full relative"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-heading-3 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              {form.id ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">E-mail (Login)</label>
                <input
                  type="email"
                  required
                  disabled={!!form.id}
                  className="form-input disabled:opacity-50"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{form.id ? 'Nova Senha (opcional)' : 'Senha Inicial'}</label>
                <input
                  type="text"
                  required={!form.id}
                  minLength={6}
                  className="form-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Ex: Senha@123"
                />
                <p className="text-caption text-gray-500 mt-1">
                  {form.id ? 'Deixe em branco para manter a senha atual.' : 'O usuário utilizará esta senha para entrar no painel.'}
                </p>
              </div>

              <div>
                <label className="form-label">Perfil de Acesso</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value, church_id: '' })}
                >
                  <option value="church_admin">Pastor (Ver leads apenas da sua igreja)</option>
                  <option value="admin_general">Departamental (Acesso total)</option>
                </select>
              </div>

              {form.role === 'church_admin' && (
                <div>
                  <label className="form-label">Vincular a uma Igreja</label>
                  <select
                    required
                    className="form-input"
                    value={form.church_id}
                    onChange={e => setForm({ ...form, church_id: e.target.value })}
                  >
                    <option value="">Selecione a igreja...</option>
                    {churches.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.cities?.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.role === 'admin_general' && (
                <div className="mt-2">
                  <label className="form-label">Campanhas Permitidas</label>
                  <p className="text-caption text-gray-500 mb-3">Selecione as campanhas que este usuário poderá acessar e ver os dados. Se não marcar nenhuma, o acesso ficará restrito.</p>
                  
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-lg">
                    {campaigns.map(camp => (
                      <label key={camp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                          checked={form.allowed_campaigns.includes(camp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, allowed_campaigns: [...form.allowed_campaigns, camp.id] })
                            } else {
                              setForm({ ...form, allowed_campaigns: form.allowed_campaigns.filter(id => id !== camp.id) })
                            }
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-small font-medium text-gray-900">{camp.name}</span>
                          <span className="text-caption text-gray-500">{camp.status === 'active' ? 'Ativa' : 'Inativa'}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : (form.id ? 'Salvar Alterações' : 'Criar Acesso')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
