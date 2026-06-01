import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProductManager = lazy(() => import('./components/ProductManager'));
const CustomerManager = lazy(() => import('./components/CustomerManager'));
const OrderManager = lazy(() => import('./components/OrderManager'));
import LoginPage from './components/LoginPage';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!(sessionStorage.getItem('ih_token') || localStorage.getItem('ih_token'));
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('ih_sidebar_collapsed') === 'true';
  });

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((isCollapsed) => {
      const nextValue = !isCollapsed;
      localStorage.setItem('ih_sidebar_collapsed', String(nextValue));
      return nextValue;
    });
  };

  // Inactivity automatic logout monitor (5-Minute Inactivity Threshold)
  useEffect(() => {
    if (!isAuthenticated) return;

    let inactivityTimeoutId;
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

    const handleInactivityLogout = () => {
      // Clear security session tokens
      sessionStorage.removeItem('ih_token');
      sessionStorage.removeItem('ih_user_email');
      sessionStorage.removeItem('ih_user_name');
      localStorage.removeItem('ih_token');
      localStorage.removeItem('ih_user_email');
      localStorage.removeItem('ih_user_name');

      setIsAuthenticated(false);
      setShowTimeoutModal(true); // Open visual warning modal
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeoutId);
      inactivityTimeoutId = setTimeout(handleInactivityLogout, FIVE_MINUTES);
    };

    // Events to monitor user activity
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Bind listeners
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer);
    });

    // Seed initial timer
    resetInactivityTimer();

    // Cleanup on unmount/re-auth
    return () => {
      clearTimeout(inactivityTimeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    // Clear storage keys
    sessionStorage.removeItem('ih_token');
    sessionStorage.removeItem('ih_user_email');
    sessionStorage.removeItem('ih_user_name');
    localStorage.removeItem('ih_token');
    localStorage.removeItem('ih_user_email');
    localStorage.removeItem('ih_user_name');

    setIsAuthenticated(false);
    setActiveTab('dashboard'); // Reset tab
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'products':
        return <ProductManager />;
      case 'customers':
        return <CustomerManager />;
      case 'orders':
        return <OrderManager />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  // Route protection - Redirect unauthenticated requests to secure login form
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        
        {/* Custom Security Session Timeout Modal */}
        {showTimeoutModal && (
          <div className="security-timeout-backdrop animate-fade-in">
            <div className="glass-card timeout-modal-content text-center animate-slide-up">
              <div className="timeout-alert-icon">
                <ShieldAlert size={28} />
              </div>
              <h2 className="timeout-modal-title">Session Expired</h2>
              <p className="timeout-modal-body mt-2">
                Your InventoryHub dashboard session has been automatically closed after <strong>5 minutes of inactivity</strong> to prevent unauthorized access.
              </p>
              <button
                type="button"
                onClick={() => setShowTimeoutModal(false)}
                className="btn btn-primary mt-6 w-full py-3"
              >
                Acknowledge & Sign In
              </button>
            </div>
          </div>
        )}

        <style>{`
          .security-timeout-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(12, 43, 33, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 1.5rem;
          }
          
          .timeout-modal-content {
            width: 100%;
            max-width: 400px;
            background: #ffffff !important;
            padding: 2.25rem !important;
            box-shadow: 0 10px 40px rgba(12, 43, 33, 0.15) !important;
          }
          
          .timeout-alert-icon {
            width: 3.5rem;
            height: 3.5rem;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.25rem auto;
            box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);
          }
          
          .timeout-modal-title {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--text-primary);
          }
          
          .timeout-modal-body {
            font-size: 0.9rem;
            color: var(--text-secondary);
            line-height: 1.6;
          }
          
          .mt-2 { margin-top: 0.5rem; }
          .mt-6 { margin-top: 1.5rem; }
          .w-full { width: 100%; }
        `}</style>
      </>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Dynamic left vertical sidebar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      
      {/* Right-side body panel holding content & footer */}
      <div className="app-body">
        <main className="main-content">
          <div className="content-container">
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent-indigo)', width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                Loading module...
              </div>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </main>

        <footer className="app-footer">
          <div className="footer-container">
            <p className="footer-text">&copy; {new Date().getFullYear()} InventoryHub. All rights reserved. System V1.0.0</p>
            <div className="footer-status">
              <span className="status-dot"></span>
              <span className="status-text">Production Cluster Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
