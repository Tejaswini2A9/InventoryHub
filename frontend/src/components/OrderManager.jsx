import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { Plus, Trash2, X, AlertTriangle, Eye, Check, FileText, User, BadgeCheck, History, Mail } from 'lucide-react';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [soldOrders, setSoldOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeView, setActiveView] = useState('active');
  const [emailingOrderId, setEmailingOrderId] = useState(null);

  // Creation State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  // Details State
  const [viewingOrderDetail, setViewingOrderDetail] = useState(null);

  const fetchInitialData = async () => {
    try {
      const [allOrders, allSoldOrders, allProducts, allCustomers] = await Promise.all([
        api.getOrders(),
        api.getSoldOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(allOrders);
      setSoldOrders(allSoldOrders);
      setProducts(allProducts);
      setCustomers(allCustomers);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory and order data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const openCreateForm = () => {
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setShowCreateForm(true);
    clearAlerts();
  };

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Calculate local subtotal estimate for UI purposes
  const calculateLocalTotal = () => {
    return orderItems.reduce((acc, item) => {
      if (!item.product_id) return acc;
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (!product) return acc;
      return acc + (product.price * (parseInt(item.quantity) || 0));
    }, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!selectedCustomerId) {
      return setError('Please select a customer.');
    }

    if (orderItems.length === 0) {
      return setError('Order must contain at least one product.');
    }

    // Verify item uniqueness and positive quantities
    const productIdsSet = new Set();
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        return setError(`Please select a product for item row #${i + 1}.`);
      }
      if (productIdsSet.has(item.product_id)) {
        return setError('Duplicate products in order. Please consolidate quantities.');
      }
      productIdsSet.add(item.product_id);

      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return setError(`Quantity for item row #${i + 1} must be a positive integer.`);
      }

      // Check stock limit in frontend
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product && product.quantity < qty) {
        return setError(`Insufficient inventory for product "${product.name}". Requested: ${qty}, In stock: ${product.quantity}.`);
      }
    }

    try {
      const payload = {
        customer_id: parseInt(selectedCustomerId),
        items: orderItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }))
      };

      await api.createOrder(payload);
      setSuccess('Order successfully placed and logged. Stock decriments updated.');
      setShowCreateForm(false);
      fetchInitialData(); // Reload all data to refresh stock counts
    } catch (err) {
      setError(err.message || 'An error occurred while placing the order.');
    }
  };

  const handleViewDetails = async (id) => {
    clearAlerts();
    try {
      const detail = await api.getOrder(id);
      setViewingOrderDetail(detail);
    } catch (err) {
      setError(`Failed to fetch order details: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? Quantities will be restocked.')) return;
    clearAlerts();

    try {
      await api.deleteOrder(id);
      setSuccess('Order cancelled successfully. Quantities have been restocked into inventory.');
      fetchInitialData();
    } catch (err) {
      setError(err.message || 'Failed to delete order.');
    }
  };

  const handleMarkSold = async (id) => {
    if (!window.confirm('Mark this order as sold to the customer? It will move to sold history and can no longer be cancelled.')) return;
    clearAlerts();

    try {
      await api.markOrderSold(id);
      setSuccess('Order marked as sold and moved to sales history.');
      fetchInitialData();
    } catch (err) {
      setError(err.message || 'Failed to mark order as sold.');
    }
  };

  const handleEmailOrder = async (id) => {
    clearAlerts();
    setEmailingOrderId(id);

    try {
      const response = await api.emailOrderDetails(id);
      setSuccess(response.message || 'Order details sent to the customer email.');
    } catch (err) {
      setError(err.message || 'Failed to email order details.');
    } finally {
      setEmailingOrderId(null);
    }
  };

  return (
    <div className="order-manager animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Registry</h1>
          <p className="text-secondary mt-1">Place client orders, track payments, and manage order cancellations.</p>
          <div className="badge badge-indigo mt-2">{orders.length} active orders</div>
        </div>
        <button onClick={openCreateForm} className="btn btn-primary" disabled={customers.length === 0 || products.length === 0}>
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {customers.length === 0 && !loading && (
        <div className="alert alert-danger mb-4">
          <AlertTriangle size={18} />
          <span>You must register at least one Customer before placing an order.</span>
        </div>
      )}
      {products.length === 0 && !loading && (
        <div className="alert alert-danger mb-4">
          <AlertTriangle size={18} />
          <span>You must create at least one Product in inventory before placing an order.</span>
        </div>
      )}

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

      <div className="order-view-tabs" role="tablist" aria-label="Order registry views">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'active'}
          className={`order-view-tab ${activeView === 'active' ? 'active' : ''}`}
          onClick={() => setActiveView('active')}
        >
          <FileText size={16} />
          Active Orders
          <span className="order-tab-count">{orders.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'history'}
          className={`order-view-tab ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <History size={16} />
          Sold History
          <span className="order-tab-count">{soldOrders.length}</span>
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent-indigo)', width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
          Loading system registries...
        </div>
      ) : activeView === 'active' ? (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer ID</th>
                <th>Placed Date</th>
                <th className="text-right">Invoice Total</th>
                <th className="text-center">Operations</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-note">
                    No active orders yet. Add products and customers, then use Create Order to start processing transactions.
                  </td>
                </tr>
              ) : orders.map((order) => {
                const customer = customers.find(c => c.id === order.customer_id);
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="flex-align gap-2 font-semibold">
                        <FileText size={16} className="text-indigo" />
                        <span className="font-mono">#ORD-{order.id.toString().padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex-align gap-1">
                        <span className="font-semibold text-primary">{customer ? customer.name : `Client #${order.customer_id}`}</span>
                        <span className="text-muted font-mono text-xs">({order.customer_id})</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-muted">
                        {new Date(order.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="text-right font-mono font-semibold text-primary">${order.total_amount.toFixed(2)}</td>
                    <td className="text-center">
                      <div className="flex-center gap-2">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="btn btn-secondary btn-icon"
                          title="View Invoice Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleMarkSold(order.id)}
                          className="btn btn-sold btn-icon"
                          title="Mark Order as Sold"
                        >
                          <BadgeCheck size={14} />
                        </button>
                        <button
                          onClick={() => handleEmailOrder(order.id)}
                          className="btn btn-email btn-icon"
                          title="Email Order Details to Customer"
                          disabled={emailingOrderId === order.id}
                        >
                          <Mail size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="btn btn-danger btn-icon"
                          title="Cancel & Restock Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Sold Date</th>
                <th className="text-right">Invoice Total</th>
                <th className="text-center">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {soldOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-note">
                    No sold orders logged yet. Orders marked as sold will appear in this history table.
                  </td>
                </tr>
              ) : soldOrders.map((order) => {
                const customer = customers.find(c => c.id === order.customer_id);
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="flex-align gap-2 font-semibold">
                        <BadgeCheck size={16} className="text-success" />
                        <span className="font-mono">#ORD-{order.id.toString().padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-primary">{customer ? customer.name : `Client #${order.customer_id}`}</span>
                    </td>
                    <td>
                      <span className="font-mono text-muted">
                        {new Date(order.sold_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="text-right font-mono font-semibold text-primary">${order.total_amount.toFixed(2)}</td>
                    <td className="text-center">
                      <div className="flex-center gap-2">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="btn btn-secondary btn-icon"
                          title="View Sold Invoice Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEmailOrder(order.id)}
                          className="btn btn-email btn-icon"
                          title="Email Sold Order Details to Customer"
                          disabled={emailingOrderId === order.id}
                        >
                          <Mail size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal Form */}
      {showCreateForm && createPortal(
        <div className="modal-backdrop">
          <div className="glass-card modal-content order-modal animate-slide-up">
            <div className="modal-header">
              <h2 className="module-title">Compose Client Order</h2>
              <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary btn-icon modal-close" aria-label="Close order form" title="Close order form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="form-group">
                <label className="form-label">Client Reference</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Choose registered customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex-between mb-2">
                  <span className="form-label font-bold text-primary">Line Items</span>
                  <button type="button" onClick={handleAddItemRow} className="btn btn-secondary py-1 px-3 text-xs">
                    + Add Item Row
                  </button>
                </div>

                <div className="items-list-container">
                  {orderItems.map((item, index) => {
                    const selectedProd = products.find(p => p.id === parseInt(item.product_id));
                    const maxStock = selectedProd ? selectedProd.quantity : 0;
                    
                    return (
                      <div key={index} className="flex-align gap-2 mb-3 item-row">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          className="form-select flex-grow"
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                              {p.name} (${p.price.toFixed(2)} - In Stock: {p.quantity})
                            </option>
                          ))}
                        </select>

                        <div className="form-group mb-0 qty-input-group">
                          <input
                            type="number"
                            min="1"
                            max={maxStock || undefined}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="form-input text-center qty-input"
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="btn btn-danger btn-icon"
                          disabled={orderItems.length === 1}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Invoice Quote Box */}
              <div className="invoice-quote-box mt-6 flex-between">
                <span className="text-secondary font-semibold">Estimated Total Amount:</span>
                <span className="total-glowing-price">${calculateLocalTotal().toFixed(2)} USD</span>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice Details Modal View */}
      {viewingOrderDetail && createPortal(
        <div className="modal-backdrop">
          <div className="glass-card modal-content invoice-content animate-slide-up">
            <div className="modal-header">
              <div className="modal-title-group">
                <FileText size={20} className="text-indigo" />
                <h2 className="module-title font-mono">Invoice #ORD-{viewingOrderDetail.id.toString().padStart(4, '0')}</h2>
              </div>
              <button onClick={() => setViewingOrderDetail(null)} className="btn btn-secondary btn-icon modal-close" aria-label="Close invoice" title="Close invoice">
                <X size={18} />
              </button>
            </div>

            <div className="invoice-receipt-wrapper">
              <div className="grid-cols-2 receipt-header mb-6">
                <div className="receipt-section">
                  <span className="receipt-meta-label">Billed To:</span>
                  <div className="receipt-meta-value text-primary font-semibold flex-align gap-1 mt-1">
                    <User size={14} className="text-muted" />
                    <span>{viewingOrderDetail.customer.name}</span>
                  </div>
                  <div className="text-secondary text-xs font-mono">{viewingOrderDetail.customer.email}</div>
                  <div className="text-secondary text-xs font-mono">{viewingOrderDetail.customer.phone}</div>
                </div>
                <div className="receipt-section text-right">
                  <span className="receipt-meta-label">Purchase Date:</span>
                  <div className="receipt-meta-value font-mono text-primary mt-1">
                    {new Date(viewingOrderDetail.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-muted text-xs font-mono">
                    {new Date(viewingOrderDetail.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Items Purchased List */}
              <div className="receipt-items-container mb-6">
                <div className="receipt-title-label mb-2 border-b pb-2 text-primary">Ordered Items</div>
                <div className="receipt-items-list">
                {viewingOrderDetail.items.map((item) => (
                  <div key={item.id} className="flex-between py-2 border-b-dashed">
                      <div className="flex-col">
                        <span className="text-primary font-semibold font-sm">{item.product.name}</span>
                        <span className="badge badge-indigo font-mono text-xs scale-90 mt-1">{item.product.sku}</span>
                      </div>
                      <div className="text-right flex-col">
                        <span className="font-mono text-primary">{item.quantity} x ${item.unit_price.toFixed(2)}</span>
                        <span className="text-secondary font-mono text-xs font-semibold block">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Total */}
              <div className="receipt-total-block flex-between border-t pt-4">
                <span className="invoice-total-word uppercase tracking-wide text-xs font-bold text-secondary">Grand Total</span>
                <span className="invoice-total-value font-mono text-2xl text-primary font-bold">${viewingOrderDetail.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleEmailOrder(viewingOrderDetail.id)}
                className="btn btn-email"
                disabled={emailingOrderId === viewingOrderDetail.id}
              >
                <Mail size={16} />
                {emailingOrderId === viewingOrderDetail.id ? 'Sending...' : 'Email Customer'}
              </button>
              <button onClick={() => setViewingOrderDetail(null)} className="btn btn-secondary">
                Close Invoice
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .order-modal {
          max-width: 600px;
        }
        
        .invoice-content {
          max-width: 550px;
          background: #ffffff;
        }

        .order-view-tabs {
          align-items: center;
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .order-view-tab {
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          display: inline-flex;
          font-size: 0.875rem;
          font-weight: 700;
          gap: 0.5rem;
          padding: 0.65rem 0.875rem;
          transition: all var(--transition-fast);
        }

        .order-view-tab:hover {
          border-color: rgba(79, 70, 229, 0.35);
          color: var(--accent-indigo);
        }

        .order-view-tab.active {
          background: rgba(79, 70, 229, 0.08);
          border-color: rgba(79, 70, 229, 0.25);
          color: var(--accent-indigo);
        }

        .order-tab-count {
          align-items: center;
          background: rgba(79, 70, 229, 0.1);
          border-radius: 999px;
          display: inline-flex;
          font-size: 0.72rem;
          justify-content: center;
          min-width: 1.35rem;
          padding: 0.12rem 0.35rem;
        }

        .btn-sold {
          background: var(--success-glow);
          border: 1px solid rgba(16, 185, 129, 0.18);
          color: var(--success);
        }

        .btn-sold:hover {
          background: var(--success);
          color: #ffffff;
        }

        .btn-email {
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: var(--accent-violet);
        }

        .btn-email:hover {
          background: var(--accent-violet);
          color: #ffffff;
        }

        .text-success {
          color: var(--success);
        }
        
        .qty-input-group {
          width: 5rem;
          flex: 0 0 5rem;
        }
        
        .qty-input {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .flex-grow {
          flex-grow: 1;
        }
        
        .flex-col {
          display: flex;
          flex-direction: column;
        }
        
        .border-t {
          border-top: 1px solid var(--border-glass);
        }
        
        .items-list-container {
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
        
        .invoice-quote-box {
          background: rgba(99, 102, 241, 0.08);
          border: 1px dashed rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-sm);
          padding: 1rem 1.25rem;
        }
        
        .total-glowing-price {
          font-family: monospace;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--accent-indigo);
          text-shadow: none;
        }
        
        /* Receipt Specific Styles */
        .receipt-meta-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        
        .receipt-meta-value {
          font-size: 0.95rem;
        }
        
        .receipt-title-label {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .border-b-dashed {
          border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
        }
        
        .py-2 {
          padding: 0.5rem 0;
        }
        
        .block {
          display: block;
        }
        
        .text-primary { color: var(--text-primary); }
        .font-bold { font-weight: 700; }
        .text-xs { font-size: 0.75rem; }
        .scale-90 { transform: scale(0.9); transform-origin: left; }

        @media (max-width: 640px) {
          .item-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 4.5rem 2.25rem;
          }

          .invoice-quote-box {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.35rem;
          }

          .receipt-header {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
