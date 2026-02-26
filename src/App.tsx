import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { useAuth } from './contexts/AuthContext';
import React from 'react';

import IndexPage from './pages/index';
import ClientesPage from './pages/clientes';
import ClienteDetalhePage from './pages/clienteDetalhe';
import FinanceiroPage from './pages/financeiro';
import CrmPage from './pages/crm';
import ServicosPage from './pages/servicos';
import AtividadesPage from './pages/atividades';
import ReunioesPage from './pages/reunioes';
import CaptacoesPage from './pages/captacoes';
import ConfiguracoesPage from './pages/configuracoes';
import LoginPage from './pages/login';
import PontoPage from './pages/ponto';
import SharedCalendarPage from './pages/sharedCalendar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <svg className="animate-spin w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <svg className="animate-spin w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    )
  }

  const isAdmin = user?.email === 'renata@startdigital.com' || user?.user_metadata?.role === 'admin';

  if (!user || !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/c/:id" element={<SharedCalendarPage />} />

      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<IndexPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/:id" element={<ClienteDetalhePage />} />
        <Route path="/financeiro" element={<AdminRoute><FinanceiroPage /></AdminRoute>} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/servicos" element={<ServicosPage />} />
        <Route path="/atividades" element={<AtividadesPage />} />
        <Route path="/reunioes" element={<ReunioesPage />} />
        <Route path="/captacoes" element={<CaptacoesPage />} />
        <Route path="/ponto" element={<PontoPage />} />
        <Route path="/configuracoes" element={<AdminRoute><ConfiguracoesPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
