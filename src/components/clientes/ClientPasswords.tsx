import { useState, useEffect } from 'react'
import { Plus, Eye, Copy, Trash2, ExternalLink, Lock, AlertCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ClientCredential {
  id: string
  client_id: string
  platform: string
  username: string
  encrypted_password?: string
  password?: string // mapping the DB column
  login_url?: string
  notes?: string
}

interface ClientPasswordsProps {
  clientId: string
}

export function ClientPasswords({ clientId }: ClientPasswordsProps) {
  const [credentials, setCredentials] = useState<ClientCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  
  // States to add new
  const [platform, setPlatform] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginUrl, setLoginUrl] = useState('')
  const [notes, setNotes] = useState('')

  // State for Re-auth confirmation
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [authError, setAuthError] = useState('')
  const [targetRevealId, setTargetRevealId] = useState<string | null>(null)

  useEffect(() => {
    loadCredentials()
  }, [clientId])

  async function loadCredentials() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('client_credentials')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Para simplificar, assumimos que encrypted_password é a senha salva (protegida via RLS no supabase)
      setCredentials(data || [])
    } catch (err) {
      console.error('Erro ao carregar senhas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddCredential(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('client_credentials')
        .insert([{
          client_id: clientId,
          platform,
          username,
          encrypted_password: password, // Mantendo nomenclatura da coluna
          login_url: loginUrl,
          notes
        }])
        .select()
        .single()

      if (error) throw error
      
      setCredentials([data, ...credentials])
      setIsAddOpen(false)
      // reset form
      setPlatform('')
      setUsername('')
      setPassword('')
      setLoginUrl('')
      setNotes('')
    } catch (err) {
      console.error('Erro ao adicionar credencial:', err)
      alert('Erro ao salvar senha.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover esta credencial?')) return
    try {
      const { error } = await supabase.from('client_credentials').delete().eq('id', id)
      if (error) throw error
      setCredentials(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir.')
    }
  }

  async function handleRevealSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setIsConfirming(true)

    try {
      // Get current user email to re-authenticate
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) throw new Error('Usuário não encontrado.')

      // O "Pulo do Gato": Reautenticação
      const { error } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: confirmPassword
      })

      if (error) {
        setAuthError('Senha incorreta. Acesso negado.')
      } else {
        // Sucesso: adiciona ID na lista de revelados
        if (targetRevealId) {
          setRevealedIds(prev => new Set(prev).add(targetRevealId))
        }
        setAuthModalOpen(false)
        setConfirmPassword('')
        setTargetRevealId(null)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro de autenticação')
    } finally {
      setIsConfirming(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    // omitimos toast complexo por simplicidade
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cofre de Senhas</h2>
          <p className="text-sm text-gray-500 mt-1">Acessos restritos de plataformas do cliente</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Acesso
        </button>
      </div>

      {isLoading ? (
        <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
      ) : credentials.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-600">Nenhuma senha cadastrada</h3>
          <p className="text-sm text-gray-400 mt-1">Adicione credenciais de redes sociais ou ferramentas do cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map(cred => {
            const isRevealed = revealedIds.has(cred.id)
            return (
              <div key={cred.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative group">
                
                <button 
                  onClick={() => handleDelete(cred.id)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <h3 className="font-bold text-gray-900 truncate">{cred.platform}</h3>
                    {cred.login_url && (
                      <a href={cred.login_url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-0.5 w-max">
                        Acessar Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase w-12">Login</span>
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">{cred.username}</span>
                    <button onClick={() => handleCopy(cred.username)} className="text-gray-400 hover:text-purple-600 px-1">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase w-12">Senha</span>
                    <div className="flex-1 flex items-center pr-2">
                      {isRevealed ? (
                        <span className="text-sm font-mono font-medium text-gray-800 tracking-wider">
                          {cred.encrypted_password || cred.password}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 tracking-[0.2em] font-bold line-clamp-1 w-full mt-1">
                          ••••••••••••
                        </span>
                      )}
                    </div>
                    
                    {!isRevealed ? (
                      <button 
                        onClick={() => {
                          setTargetRevealId(cred.id)
                          setAuthModalOpen(true)
                        }} 
                        className="text-gray-400 hover:text-purple-600 px-1"
                        title="Revelar (Requer Autenticação)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCopy(cred.encrypted_password || cred.password || '')} 
                        className="text-gray-400 hover:text-purple-600 px-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {cred.notes && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 italic line-clamp-2">{cred.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Re-Authentication */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Acesso Restrito</h3>
                <p className="text-xs text-gray-500">Confirme sua identidade</p>
              </div>
            </div>
            
            <form onSubmit={handleRevealSubmit} className="flex flex-col gap-4">
              {authError && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{authError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sua Senha do Start Digital</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  required
                />
              </div>

              <div className="flex gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
                  disabled={isConfirming}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isConfirming || !confirmPassword}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {isConfirming ? 'Validando...' : 'Desbloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Credential */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative bg-[#f5f5f7] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col h-full max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 bg-white rounded-t-3xl border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Nova Credencial</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white rounded-b-3xl">
              <form id="cred-form" onSubmit={handleAddCredential} className="flex flex-col gap-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Plataforma / Rede *</label>
                    <input
                      type="text"
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      placeholder="Ex: Instagram, Nuvemshop"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none text-sm transition-all text-gray-800 font-medium"
                      required
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Usuário/E-mail *</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="@ ou login"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none text-sm transition-all text-gray-800 font-medium"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Senha *</label>
                    <input
                      type="text"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Digite a senha"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none text-sm transition-all text-gray-800 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">URL de Login (Opcional)</label>
                  <input
                    type="url"
                    value={loginUrl}
                    onChange={e => setLoginUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none text-sm transition-all text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Observações Adicionais</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: 2FA ativo no chip da vivo, manda SMS para o dono."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none text-sm transition-all text-gray-800 min-h-[80px] resize-y"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 bg-white border-t border-gray-100 rounded-b-3xl">
               <button
                  type="submit"
                  form="cred-form"
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  Salvar no Cofre
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
