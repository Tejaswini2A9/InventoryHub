import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Users, ShoppingCart, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, onLogout, isCollapsed, onToggleCollapse }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userName, setUserName] = useState('Administrator');
  const [userEmail, setUserEmail] = useState('admin@inventoryhub.com');

  // Load user data dynamically from storage
  useEffect(() => {
    const storedName = sessionStorage.getItem('ih_user_name') || localStorage.getItem('ih_user_name');
    const storedEmail = sessionStorage.getItem('ih_user_email') || localStorage.getItem('ih_user_email');
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, [activeTab]);

  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 768px)');
    const closeMobileSidebar = () => setIsMobileOpen(false);

    closeMobileSidebar();
    mobileViewport.addEventListener('change', closeMobileSidebar);

    return () => mobileViewport.removeEventListener('change', closeMobileSidebar);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileOpen(false); // Close sidebar on mobile after selecting a tab
  };

  return (
    <>
      {/* 1. Mobile Header (Visible only on mobile/tablet) */}
      <header className="mobile-header">
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="mobile-menu-toggle" 
          aria-label="Open navigation menu"
          aria-controls="main-navigation-sidebar"
          aria-expanded={isMobileOpen}
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <div className="mobile-logo-icon">I</div>
          <span className="mobile-logo-text">Inventory<span className="mobile-logo-subtext">Hub</span></span>
        </div>
        <div style={{ width: 24 }}></div> {/* Balance spacer */}
      </header>

      {/* 2. Mobile Backdrop (Overlay when drawer is active) */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* 3. Main Navigation Sidebar Container */}
      <aside id="main-navigation-sidebar" className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)} 
          className="mobile-close-btn"
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="desktop-collapse-btn"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        {/* Sidebar Logo / Branding */}
        <div className="sidebar-logo">
          <div className="logo-icon">I</div>
          <span className="logo-text">Inventory<span className="logo-subtext">Hub</span></span>
        </div>

        {/* Dynamic Navigation Links stacked vertically */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} className="nav-item-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Account Profile Card & Logout Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          
          {onLogout && (
            <button onClick={onLogout} className="btn-logout" title="Sign Out of InventoryHub">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>

      <style>{`
        /* Desktop Fixed Sidebar */
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-glass);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          z-index: 1000;
          transition: transform var(--transition-normal), width var(--transition-normal), padding var(--transition-normal);
        }

        .mobile-close-btn {
          display: none;
        }

        .desktop-collapse-btn {
          align-items: center;
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
          border: 1px solid rgba(79, 70, 229, 0.2);
          border-radius: 0.7rem;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
          color: var(--accent-indigo);
          cursor: pointer;
          display: flex;
          height: 2.25rem;
          justify-content: center;
          position: absolute;
          right: -1.125rem;
          top: 1.85rem;
          transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
          width: 2.25rem;
          z-index: 2;
        }

        .desktop-collapse-btn:hover {
          background: var(--accent-gradient);
          border-color: var(--accent-indigo);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.24);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .desktop-collapse-btn:focus-visible {
          outline: 3px solid rgba(79, 70, 229, 0.2);
          outline-offset: 3px;
        }

        .desktop-collapse-btn:active {
          transform: translateY(0);
        }

        /* Sidebar Logo */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .logo-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-sm);
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 1.25rem;
          font-family: var(--font-heading);
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
        }

        .logo-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.3rem;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }

        .logo-subtext {
          color: var(--accent-indigo);
          font-weight: 500;
        }

        /* Sidebar Nav List */
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.85rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
        }

        .sidebar-nav-item:hover {
          color: var(--accent-indigo);
          background: rgba(79, 70, 229, 0.04);
        }

        .sidebar-nav-item.active {
          color: #ffffff;
          background: var(--accent-indigo);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        }

        .nav-item-icon {
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }

        .sidebar-nav-item:hover .nav-item-icon {
          transform: translateX(2px);
        }

        .sidebar-nav-item.active:hover .nav-item-icon {
          transform: none;
        }

        /* Sidebar Account Card Footer */
        .sidebar-footer {
          border-top: 1px solid var(--border-glass);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-profile-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #f8fafc;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-sm);
        }

        .user-avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          font-family: var(--font-heading);
          box-shadow: var(--shadow-sm);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-logout {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
        }

        .btn-logout:hover {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);
        }

        .app-sidebar.is-collapsed {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          width: 84px;
        }

        .app-sidebar.is-collapsed .sidebar-logo {
          justify-content: center;
          padding-left: 0;
        }

        .app-sidebar.is-collapsed .logo-text,
        .app-sidebar.is-collapsed .sidebar-nav-item span,
        .app-sidebar.is-collapsed .user-info,
        .app-sidebar.is-collapsed .btn-logout span {
          display: none;
        }

        .app-sidebar.is-collapsed .sidebar-nav-item {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }

        .app-sidebar.is-collapsed .user-profile-card {
          justify-content: center;
          padding: 0.5rem 0;
        }

        .app-sidebar.is-collapsed .btn-logout {
          padding-left: 0;
          padding-right: 0;
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
        }

        /* Responsive Mobile Drawer Styling */
        @media (max-width: 768px) {
          .mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3.75rem;
            background: #ffffff;
            border-bottom: 1px solid var(--border-glass);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.25rem;
            z-index: 999;
          }

          .mobile-menu-toggle {
            background: rgba(79, 70, 229, 0.06);
            border: 1px solid rgba(79, 70, 229, 0.12);
            color: var(--accent-indigo);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border-radius: var(--radius-sm);
            transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
          }

          .mobile-menu-toggle:hover {
            background: rgba(79, 70, 229, 0.12);
            border-color: rgba(79, 70, 229, 0.22);
            transform: translateY(-1px);
          }

          .mobile-menu-toggle:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.18);
            outline-offset: 2px;
          }

          .mobile-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .mobile-logo-icon {
            width: 1.75rem;
            height: 1.75rem;
            border-radius: 4px;
            background: var(--accent-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 1rem;
            font-family: var(--font-heading);
          }

          .mobile-logo-text {
            font-family: var(--font-heading);
            font-weight: 700;
            font-size: 1.1rem;
            letter-spacing: -0.02em;
            color: var(--text-primary);
          }

          .mobile-logo-subtext {
            color: var(--accent-indigo);
            font-weight: 500;
          }

          /* Sidebar as a responsive slide-out drawer */
          .app-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            transform: translateX(-100%);
            box-shadow: none;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
            background: #ffffff;
          }

          .app-sidebar.is-collapsed {
            padding: 2rem 1.5rem;
            width: 280px;
          }

          .app-sidebar.is-collapsed .sidebar-logo {
            justify-content: flex-start;
            padding-left: 0.5rem;
          }

          .app-sidebar.is-collapsed .logo-text,
          .app-sidebar.is-collapsed .sidebar-nav-item span,
          .app-sidebar.is-collapsed .btn-logout span {
            display: initial;
          }

          .app-sidebar.is-collapsed .user-info {
            display: flex;
          }

          .app-sidebar.is-collapsed .sidebar-nav-item {
            justify-content: flex-start;
            padding: 0.85rem 1rem;
          }

          .app-sidebar.is-collapsed .user-profile-card {
            justify-content: flex-start;
            padding: 0.5rem;
          }

          .app-sidebar.is-collapsed .btn-logout {
            padding: 0.75rem 1rem;
          }

          .desktop-collapse-btn {
            display: none;
          }

          .app-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 10px 0 30px rgba(15, 23, 42, 0.15);
          }

          .mobile-close-btn {
            display: flex;
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: background var(--transition-fast);
          }

          .mobile-close-btn:hover {
            background: #f1f5f9;
            color: var(--text-primary);
          }

          .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 1000;
            animation: fade-in-backdrop 0.2s ease-out;
          }

          @keyframes fade-in-backdrop {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </>
  );
}
