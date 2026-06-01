import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Box, Users, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent-indigo)', width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        Loading dashboard analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertTriangle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const { total_products, total_customers, total_orders, low_stock_products } = data || {
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  };

  const statCards = [
    {
      title: 'Total Products',
      value: total_products,
      icon: Box,
      color: 'indigo',
      tab: 'products'
    },
    {
      title: 'Active Customers',
      value: total_customers,
      icon: Users,
      color: 'violet',
      tab: 'customers'
    },
    {
      title: 'Orders Placed',
      value: total_orders,
      icon: ShoppingBag,
      color: 'success',
      tab: 'orders'
    },
    {
      title: 'Low Stock Warnings',
      value: low_stock_products.length,
      icon: AlertTriangle,
      color: low_stock_products.length > 0 ? 'warning' : 'muted',
      tab: 'products'
    }
  ];

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="text-secondary mt-1">Real-time inventory metrics and system analytics.</p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary">
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(card.tab)}
              className="glass-card stat-card cursor-pointer"
            >
              <div className="stat-card-header">
                <span className="stat-title">{card.title}</span>
                <div className={`stat-icon-wrapper color-${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-footer">
                <span>View Details</span>
                <ArrowRight size={14} className="arrow-icon" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-cols-3">
        {/* Low Stock Alerts Module */}
        <div className="glass-card col-span-2">
          <div className="module-header mb-4">
            <div className="flex-align gap-2">
              <AlertTriangle className="text-warning animate-pulse" size={20} />
              <h2 className="module-title">Low Stock Alerts</h2>
            </div>
            <span className="badge badge-warning">{low_stock_products.length} Critical Items</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-note">
                      No low-stock products to display. Add products to inventory or keep stock levels above the warning limit.
                    </td>
                  </tr>
                ) : low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span className="badge badge-indigo">{product.sku}</span>
                      </td>
                      <td className="text-right font-mono">${product.price.toFixed(2)}</td>
                      <td className="text-right">
                        <span className={`font-semibold font-mono ${product.quantity === 0 ? 'text-danger' : 'text-warning'}`}>
                          {product.quantity} units
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-card">
          <h2 className="module-title mb-4">Quick Operations</h2>
          <div className="quick-actions-list">
            <button
              onClick={() => setActiveTab('products')}
              className="action-btn flex-between"
            >
              <span>Add New Product</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className="action-btn flex-between"
            >
              <span>Register Customer</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="action-btn flex-between"
            >
              <span>Draft Client Order</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .flex-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .flex-align {
          display: flex;
          align-items: center;
        }
        
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .py-20 { padding: 5rem 0; }
        .text-indigo { color: var(--accent-indigo); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
        .text-secondary { color: var(--text-secondary); }
        .mt-1 { margin-top: 0.25rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .ml-3 { margin-left: 0.75rem; }
        .gap-2 { gap: 0.5rem; }
        
        .grid-cols-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        
        @media (max-width: 1024px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .grid-cols-4 {
            grid-template-columns: 1fr;
          }
        }
        
        .stat-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 8.5rem;
          padding: 1.25rem;
        }
        
        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .stat-title {
          font-size: 0.875rem;
          font-weight: 550;
          color: var(--text-secondary);
        }
        
        .stat-icon-wrapper {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .color-indigo { background: rgba(99, 102, 241, 0.1); color: var(--accent-indigo); }
        .color-violet { background: rgba(139, 92, 246, 0.1); color: var(--accent-violet); }
        .color-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .color-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
        .color-muted { background: rgba(15, 23, 42, 0.05); color: var(--text-muted); }
        
        .stat-value {
          font-size: 2.25rem;
          font-weight: 700;
          font-family: var(--font-heading);
          margin: 0.5rem 0;
          color: var(--text-primary);
        }
        
        .stat-footer {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.775rem;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        
        .stat-card:hover .stat-footer {
          color: var(--text-primary);
        }
        
        .stat-card:hover .arrow-icon {
          transform: translateX(3px);
        }
        
        .arrow-icon {
          transition: transform var(--transition-fast);
        }
        
        .col-span-2 {
          grid-column: span 2;
        }
        
        @media (max-width: 1024px) {
          .col-span-2 {
            grid-column: span 1;
          }
        }
        
        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .module-title {
          font-size: 1.15rem;
          color: var(--text-primary);
          font-weight: 600;
        }
        
        .quick-actions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .action-btn {
          width: 100%;
          background: rgba(15, 23, 42, 0.02);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          padding: 1rem 1.25rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 550;
          transition: all var(--transition-normal);
          text-align: left;
        }
        
        .action-btn:hover {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateX(3px);
        }
        
        .action-btn svg {
          color: var(--accent-indigo);
          transition: transform var(--transition-fast);
        }
        
        .action-btn:hover svg {
          transform: translateX(3px);
        }
        
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        .font-semibold { font-weight: 600; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
}
