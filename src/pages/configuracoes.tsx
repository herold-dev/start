import { useState, useEffect } from 'react'
import { Settings, Users, Plus, Trash2, Eye, EyeOff, RefreshCw, Shield, AlertCircle, CheckCircle2, Edit2, X, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface TeamMember {
  id: string
  email: string
  name?: string
  created_at: string
  last_sign_in_at?: string
  allowed_pages?: string[]
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Nunca'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}



export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'renata@startdigital.com'

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)

  // Add form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('membro')
  const [showPassword, setShowPassword] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setIsLoadingMembers(true)
    setMembersError(null)
    try {
      // Use direct select from 'usuarios' table
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error

      const mapped: TeamMember[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.nome || u.email || 'Usuário',
        created_at: u.created_at,
        allowed_pages: u.permissoes || [],
      }))
      setMembers(mapped)
    } catch (err: any) {
      setMembersError(err.message || 'Erro ao carregar membros.')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || !newPassword) {
      setAddError('E-mail e senha são obrigatórios.')
      return
    }
    if (newPassword.length < 6) {
      setAddError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setIsAdding(true)
    setAddError(null)
    setAddSuccess(false)
    try {
      // We still use supabase.auth.signUp for creating users without edge functions.
      // NOTE: This will log the user in if email confirmation is off.
      // But it triggers our `usuarios` table insertion.
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            name: newName || newEmail,
            role: newRole
          }
        }
      })
      
      if (error) throw error
      
      if (data.user) {
         setNewName('')
         setNewEmail('')
         setNewPassword('')
         setNewRole('membro')
         setAddSuccess(true)
         setTimeout(() => {
           setAddSuccess(false)
           loadMembers()
         }, 2000)
      }
    } catch (err: any) {
      setAddError(err.message || 'Erro ao criar membro.')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(member: TeamMember) {
    if (member.id === user?.id) {
      alert('Você não pode remover a si mesmo.')
      return
    }
    if (!confirm(`Remover "${member.name || member.email}" da equipe? Só é possível a exclusão definitiva via painel do Supabase, mas iremos inativá-lo.`)) return
    
    // We can't delete auth.users without edge functions or service role key securely from client.
    // Instead we could remove their permissions or remove them from `usuarios` table, breaking their login if we rely on it.
    // For now we will update them to have no permissions and "inativo" role if we had one.
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', member.id)

      if (error) throw error
      setMembers(prev => prev.filter(m => m.id !== member.id))
    } catch (err: any) {
      alert(err.message || 'Erro ao remover membro.')
    }
  }

  function openEditModal(member: TeamMember) {
    setEditingUser(member)
    setEditName(member.name || '')
    setEditPassword('')
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editingUser) return

    setIsEditing(true)
    setEditError(null)

    try {
      const { session } = await supabase.auth.getSession().then(({data}) => data)
      if (!session?.access_token) throw new Error('Não autenticado')

      // Validate password if provided
      if (editPassword && editPassword.length < 6) {
        throw new Error('A nova senha deve ter no mínimo 6 caracteres.')
      }

      // We send both name and password (if any) to the Edge Function 
      // Because it has the Service Role key to bypass RLS and Auth Admin protections securely.
      const payload: any = { 
        action: 'update', 
        id: editingUser.id, 
        name: editName 
      }
      if (editPassword) payload.password = editPassword

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let errorMsg = 'Erro ao salvar alterações no servidor.'
        try {
          const json = await res.json()
          if (json.error) errorMsg = json.error
        } catch(e) {}
        throw new Error(errorMsg)
      }

      // Update local state if successful
      setMembers(prev => prev.map(m => {
        if (m.id === editingUser.id) {
          return {
            ...m,
            name: editName,
          }
        }
        return m
      }))
      
      setEditingUser(null)
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar usuário.')
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-gray-900 leading-none flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-500" />
          Configurações
        </h2>
        <p className="text-sm text-gray-500 mt-1">Gerencie o sistema e a equipe</p>
      </header>

      {/* ── Seção: Conta atual ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Sua Conta
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {user?.email?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.user_metadata?.name || 'Usuário'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {isAdmin ? 'Admin' : (user?.user_metadata?.role || 'Membro')}
            </span>
          </div>
        </div>
      </section>

      {/* ── Seção: Equipe ── */}
      {isAdmin && (
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Equipe
            <span className="text-xs font-normal text-gray-400">({members.length} membro{members.length !== 1 ? 's' : ''})</span>
          </h3>
          <button
            onClick={loadMembers}
            disabled={isLoadingMembers}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMembers ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Member list */}
        <div className="divide-y divide-gray-50">
          {isLoadingMembers ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Carregando membros...</div>
          ) : membersError ? (
            <div className="px-6 py-6 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {membersError}
              <button onClick={loadMembers} className="ml-2 underline text-xs">Tentar novamente</button>
            </div>
          ) : members.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Nenhum membro na equipe.</div>
          ) : (
            members.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-3 group hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {(member.name || member.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {member.name || member.email}
                    {member.id === user?.id && (
                      <span className="ml-2 text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">Você</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-400">Último acesso</p>
                  <p className="text-xs font-medium text-gray-600">{formatDate(member.last_sign_in_at)}</p>
                </div>
                
                {/* Actions */}
                <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(member)}
                    className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                    title="Editar Permissões"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleDelete(member)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remover membro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add member form */}
        <div className="px-6 py-5 bg-gray-50/60 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-500" />
            Adicionar Membro
          </h4>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome (opcional)"
              className="sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="E-mail *"
              required
              className="sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
            <div className="relative sm:col-span-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Senha (mín. 6 char) *"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              <option value="membro">Membro</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={isAdding}
              className="sm:col-span-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60 shadow-sm"
            >
              {isAdding ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isAdding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>

          {addError && (
            <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {addError}
            </div>
          )}
          {addSuccess && (
            <div className="mt-2 flex items-center gap-2 text-emerald-600 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Membro adicionado com sucesso! Já pode fazer login. Lembre-se de editar as permissões dele se não for admin.
            </div>
          )}
        </div>
      </section>

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isEditing && setEditingUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all">
            
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-600" />
                  Editar Usuário
                </h3>
                <p className="text-sm text-gray-500 mt-1">{editingUser.email}</p>
              </div>
              <button 
                onClick={() => !isEditing && setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto min-h-0 space-y-6">
              
              {/* Infos Básicas */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Users className="w-4 h-4" /> Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nome</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Alterar Senha
                  </h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Digite uma nova senha abaixo para alterar o acesso deste membro. Deixe em branco se não quiser alterar a senha.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nova Senha</label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="Deixe em branco para manter a atual"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {editError}
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 shrink-0">
              <button 
                onClick={() => setEditingUser(null)} 
                disabled={isEditing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={isEditing}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm flex items-center gap-2"
              >
                {isEditing ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}

    </div>
  )
}
