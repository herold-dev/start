export type PaymentType = 'mensal' | 'unico' | 'parcelado'

export interface Client {
  id: string
  // Aba: Básico
  name: string
  email?: string
  social_handle?: string
  social_link?: string
  segment?: string
  whatsapp?: string
  status: 'Ativo' | 'Inativo'
  city_state?: string
  origin?: string
  // Visual
  avatar_url?: string
  gradient_from: string
  gradient_to: string
  // Aba: Financeiro
  service_name?: string
  service_id?: string
  contract_url?: string
  contract_value?: number
  monthly_value?: number
  payment_type?: PaymentType
  due_day?: number
  installments?: number
  payment_start_date?: string
  created_at: string
  // Compartilhamento
  shared_calendar_active?: boolean
  shared_calendar_password?: string
}

export type ClientInput = Omit<Client, 'id' | 'created_at'>

/* ─── Content Calendar ────────────────────────────────────────────────── */

export type ContentType = 'feed' | 'story' | 'feed_e_story'
export type ContentStatus = 'rascunho' | 'em_aprovacao' | 'ajuste' | 'aprovado'
export type ContentChannel = 'video' | 'imagem'

export interface ClientContent {
  id: string
  client_id: string
  title: string
  description?: string
  content_type: ContentType
  status: ContentStatus          // status geral (usado no calendário)
  channel: ContentChannel
  scheduled_date?: string        // DATE as ISO string

  // Aba Tema
  tema_content?: string
  tema_status?: ContentStatus

  // Aba Conteúdo
  conteudo_content?: string
  conteudo_status?: ContentStatus

  // Aba Mídia
  midia_url?: string
  midia_status?: ContentStatus

  // Aba Legenda
  legenda_content?: string
  legenda_status?: ContentStatus

  // Integration com Captações
  precisa_captacao?: boolean
  capture_id?: string | null

  created_at: string
}

export type ClientContentInput = Omit<ClientContent, 'id' | 'created_at'>

/* ─── Client Notes (abas de anotação) ─────────────────────────────────── */

export type NoteTab = 'diagnostico' | 'persona' | 'concorrencia' | 'posicionamento' | 'produtos' | 'ia'

export interface ClientNote {
  id: string
  client_id: string
  tab: NoteTab
  content: string
  updated_at: string
}

/* ─── Instagram Metrics ───────────────────────────────────────────────── */

export interface InstagramMetric {
  id: string
  client_id: string
  period: string          // "YYYY-MM"
  seguidores?: number
  alcance?: number
  impressoes?: number
  visualizacoes?: number
  interacoes?: number
  cliques_perfil?: number
  salvamentos?: number
  compartilhamentos?: number
  novos_seguidores?: number
  created_at: string
  updated_at: string
}

export type InstagramMetricInput = Omit<InstagramMetric, 'id' | 'created_at' | 'updated_at'>

/* ─── Highlighted Posts (posts em destaque) ────────────────────────────── */

export interface HighlightedPost {
  id: string
  client_id: string
  content_id: string
  period: string
  highlight_reason?: string
  highlight_metrics?: string
  post_url?: string
  sort_order?: number
  created_at: string
  // Joined from client_contents
  content_title?: string
  content_type?: ContentType
  content_thumbnail?: string
  content_status?: ContentStatus
  content_scheduled_date?: string
}
