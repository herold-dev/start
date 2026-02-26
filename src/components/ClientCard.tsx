import type { Client } from './clientes/types'

export type { Client }

interface ClientCardProps {
  client: Client
  onClick: (client: Client) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const PAY_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  unico: 'Pgto Único',
  parcelado: 'Parcelado',
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const {
    name, social_handle, segment, status, avatar_url,
    gradient_from, gradient_to, service_name, contract_value, payment_type,
  } = client

  const isAtivo = status === 'Ativo'
  const initials = getInitials(name)

  return (
    <div
      onClick={() => onClick(client)}
      className="bg-white rounded-[20px] border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative group hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Top Gradient */}
      <div
        className="h-[110px] w-full shrink-0"
        style={{ background: `linear-gradient(135deg, ${gradient_from}, ${gradient_to})` }}
      />

      {/* Profile Image / Initials */}
      <div className="absolute top-[68px] left-6">
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={name}
            className="w-[72px] h-[72px] rounded-[18px] border-4 border-white object-cover shadow-sm"
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-[18px] border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-white select-none"
            style={{ background: `linear-gradient(135deg, ${gradient_from}, ${gradient_to})` }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pt-11 pb-5 flex-1 flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 shrink-0 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <h3 className="text-[17px] font-bold text-gray-800 leading-none">{name}</h3>
            </div>
            {social_handle && (
              <span className="text-[12px] text-gray-400 mt-1.5 ml-4 font-medium">@ {social_handle.replace('@', '')}</span>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
              isAtivo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Segment */}
        {segment && (
          <div className="mt-2.5 ml-4">
            <span className="bg-gray-100/80 text-gray-600 text-[11px] px-2.5 py-1 rounded-md font-semibold tracking-wide border border-gray-200/60">
              {segment}
            </span>
          </div>
        )}

        {/* Financeiro info */}
        {(service_name || contract_value) && (
          <div className="mt-auto pt-4 border-t border-gray-50 mt-4">
            <div className="flex items-center justify-between">
              {service_name && (
                <span className="text-xs text-gray-500 font-medium truncate max-w-[60%]">{service_name}</span>
              )}
              {contract_value && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-gray-800">
                    {Number(contract_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {payment_type && (
                    <span className="text-[10px] text-gray-400">{PAY_LABEL[payment_type] || ''}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
