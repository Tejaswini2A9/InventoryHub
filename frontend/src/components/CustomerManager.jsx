import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { Plus, Trash2, X, AlertTriangle, Search, Check, Mail, Phone, User } from 'lucide-react';

export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const openAddForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setShowForm(true);
    clearAlerts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    // Client-side validation
    if (!name.trim()) return setError('Full name is required');
    if (!email.trim()) return setError('Email address is required');
    if (!phone.trim()) return setError('Phone number is required');

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return setError('Please enter a valid email address');
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      };

      await api.createCustomer(payload);
      setSuccess(`Customer '${payload.name}' registered successfully!`);
      
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to register customer. The email might already be in use.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    clearAlerts();

    try {
      await api.deleteCustomer(id);
      setSuccess(`Customer '${name}' deleted successfully.`);
      fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to delete customer. They might have active orders in the system.');
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(search.toLowerCase()) || 
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search)
  );

  return (
    <div className="customer-manager animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Database</h1>
          <p className="text-secondary mt-1">Register new clients and manage their contact details.</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-card mb-6 customer-search-panel">
        <div className="customer-search-heading">
          <div>
            <label className="customer-search-label" htmlFor="customer-search">Search customers</label>
            <p className="customer-search-hint">Find an account by name, email address, or phone number.</p>
          </div>
          <div className="badge badge-indigo customer-search-count">{filteredCustomers.length} accounts found</div>
        </div>
        <div className="customer-search-input-container">
          <Search size={19} className="customer-search-icon" aria-hidden="true" />
          <input
            id="customer-search"
            type="search"
            placeholder="Type a name, email, or phone number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="customer-search-input"
          />
          {search && (
            <button
              type="button"
              className="customer-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear customer search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent-indigo)', width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
          Loading customer list...
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Registration Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-note">
                    {search ? 'No customers match your search. Try another name, email, or phone number.' : 'No customers registered yet. Use Add Customer to register your first client.'}
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td><span className="font-mono text-muted">{customer.id}</span></td>
                  <td>
                    <div className="flex-align gap-2">
                      <div className="avatar-placeholder">
                        <User size={14} />
                      </div>
                      <span className="font-semibold text-primary">{customer.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-align gap-2 text-secondary">
                      <Mail size={14} className="text-muted" />
                      <span>{customer.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-align gap-2 text-secondary">
                      <Phone size={14} className="text-muted" />
                      <span>{customer.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-muted">
                      {new Date(customer.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="btn btn-danger btn-icon"
                      title="Delete Customer Profile"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal Drawer */}
      {showForm && createPortal(
        <div className="modal-backdrop">
          <div className="glass-card modal-content animate-slide-up">
            <div className="modal-header">
              <h2 className="module-title">Register New Customer</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-icon modal-close" aria-label="Close customer form" title="Close customer form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexander Mercer"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Unique)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.mercer@gmail.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="form-input"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .avatar-placeholder {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        
        .text-primary { color: var(--text-primary); }

        .mb-6 { margin-bottom: 1.5rem; }

        .customer-search-panel {
          padding: 1rem;
        }

        .customer-search-heading {
          align-items: center;
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 0.875rem;
        }

        .customer-search-label {
          color: var(--text-primary);
          cursor: pointer;
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .customer-search-hint {
          color: var(--text-secondary);
          font-size: 0.8rem;
          line-height: 1.45;
        }

        .customer-search-count {
          flex: 0 0 auto;
        }

        .customer-search-input-container {
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-sm);
          display: flex;
          gap: 0.75rem;
          min-height: 3rem;
          padding: 0 0.875rem;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .customer-search-input-container:focus-within {
          border-color: var(--accent-indigo);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .customer-search-icon {
          color: var(--accent-indigo);
          flex: 0 0 auto;
        }

        .customer-search-input {
          background: transparent;
          border: 0;
          color: var(--text-primary);
          flex: 1;
          font-size: 0.95rem;
          min-width: 0;
          outline: 0;
          padding: 0.75rem 0;
        }

        .customer-search-input::placeholder {
          color: var(--text-muted);
        }

        .customer-search-input::-webkit-search-cancel-button {
          display: none;
        }

        .customer-search-clear {
          align-items: center;
          background: rgba(79, 70, 229, 0.06);
          border: 0;
          border-radius: 50%;
          color: var(--accent-indigo);
          cursor: pointer;
          display: flex;
          flex: 0 0 auto;
          height: 1.75rem;
          justify-content: center;
          transition: background var(--transition-fast), transform var(--transition-fast);
          width: 1.75rem;
        }

        .customer-search-clear:hover {
          background: rgba(79, 70, 229, 0.14);
          transform: scale(1.05);
        }

        @media (max-width: 640px) {
          .customer-search-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
