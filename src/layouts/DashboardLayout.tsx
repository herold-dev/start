import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Mobile Header (hidden on desktop via css) */}
      <div className="mobile-header">
        <span className="mobile-logo">START DIGITAL</span>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
      />
      
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
