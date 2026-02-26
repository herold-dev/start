import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Video,
  Camera,
  Clock,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ALL_MENU_ITEMS = [
  { icon: Home, label: 'Início', path: '/', permissionKey: 'dashboard' },
  { icon: Clock, label: 'Ponto', path: '/ponto', permissionKey: 'ponto' },
  { icon: Users, label: 'Clientes', path: '/clientes', permissionKey: 'clientes' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro', permissionKey: 'financeiro' },
  { icon: TrendingUp, label: 'CRM', path: '/crm', permissionKey: 'crm' },
  { icon: Package, label: 'Serviços', path: '/servicos', permissionKey: 'servicos' },
  { icon: BookOpen, label: 'Processos', path: '/processos', permissionKey: 'processos' },
  { icon: Video, label: 'Reuniões', path: '/reunioes', permissionKey: 'reunioes' },
  { icon: Camera, label: 'Captações', path: '/captacoes', permissionKey: 'captacoes' },
  { icon: Activity, label: 'Atividades', path: '/atividades', permissionKey: 'atividades' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', permissionKey: 'configuracoes' },
];

export function Sidebar({ mobileMenuOpen, closeMobileMenu }: { mobileMenuOpen?: boolean; closeMobileMenu?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  // Get name from DB if available, fallback to metadata or email
  let displayName = user?.user_metadata?.name;
  if (!displayName && user?.email) {
    const base = user.email.split('@')[0];
    displayName = base.charAt(0).toUpperCase() + base.slice(1);
  }
  displayName = displayName || 'Usuário';

  const initials = displayName.slice(0, 2).toUpperCase();
  const role = user?.user_metadata?.role || 'membro';

  const isAdmin = user?.email === 'renata@startdigital.com' || role === 'admin';

  const filteredMenuItems = ALL_MENU_ITEMS.filter(item => {
    if (!isAdmin) {
      if (item.path === '/financeiro' || item.path === '/configuracoes') {
        return false;
      }
    }
    return true;
  });

  return (
    <aside className="sidebar" data-collapsed={String(collapsed)} data-mobile-open={String(!!mobileMenuOpen)}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span>START DIGITAL</span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-list">
          {filteredMenuItems.map((item: any) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                if (closeMobileMenu) {
                  closeMobileMenu();
                }
              }}
            >
              <item.icon size={22} className="sidebar-link-icon" />
              <div className="sidebar-link-content">
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer: user info + logout */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          title={collapsed ? displayName : undefined}
        >
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
            <span className="sidebar-user-role capitalize">{isAdmin ? 'Admin' : role}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="sidebar-logout"
          title="Sair"
          type="button"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
