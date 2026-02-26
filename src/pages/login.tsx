import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { signIn } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setIsLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.')
      else setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Lado esquerdo — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950 flex-col justify-between p-12">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-fuchsia-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        {/* Grid lines overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 mb-6">
            <span className="text-white font-black text-lg">S</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            START<br />DIGITAL
          </h1>
          <p className="text-gray-500 text-sm mt-2">Painel de Gestão</p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 flex flex-col gap-5">
          {[
            { icon: '📊', title: 'Gestão completa', desc: 'Clientes, projetos e finanças em um só lugar' },
            { icon: '🎯', title: 'CRM inteligente', desc: 'Funil de vendas com visão 360° dos seus leads' },
            { icon: '📅', title: 'Calendário integrado', desc: 'Reuniões, captações e atividades organizadas' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-gray-600 text-xs">© 2025 Start Digital · Todos os direitos reservados</p>
        </div>
      </div>

      {/* ── Lado direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-base">S</span>
            </div>
            <span className="font-black text-xl tracking-tight">START DIGITAL</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-gray-500 mt-1">Entre com suas credenciais para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm placeholder-gray-400"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed group mt-1"
            >
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-8">Problemas para entrar? Fale com o administrador.</p>
        </div>
      </div>
    </div>
  )
}
