import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { Plus, Edit2, Trash2, X, AlertTriangle, Search, Check, Barcode, Boxes, PackageCheck } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setQuantity('');
    setShowForm(true);
    clearAlerts();
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setShowForm(true);
    clearAlerts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    // Client-side validations
    if (!name.trim()) return setError('Product name is required');
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return setError('Price must be a valid non-negative number');
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return setError('Quantity in stock must be a non-negative integer');
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        price: parsedPrice,
        quantity: parsedQty
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccess(`Product '${payload.name}' updated successfully.`);
      } else {
        await api.createProduct(payload);
        setSuccess(`Product '${payload.name}' added successfully.`);
      }

      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    clearAlerts();

    try {
      await api.deleteProduct(id);
      setSuccess(`Product '${name}' deleted successfully.`);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product. It might be referenced in an existing order.');
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(normalizedSearch) ||
    product.sku.toLowerCase().includes(normalizedSearch)
  );
  const lowStockCount = products.filter(product => product.quantity <= 10).length;
  const totalUnits = products.reduce((total, product) => total + product.quantity, 0);

  return (
    <div className="product-manager animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Inventory</h1>
          <p className="text-secondary mt-1">Manage and track your products, prices, and stock levels.</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="inventory-summary">
        <div className="glass-card summary-card">
          <div className="summary-icon summary-icon-indigo"><Boxes size={19} /></div>
          <div>
            <span className="summary-label">Catalog Items</span>
            <strong>{products.length}</strong>
          </div>
        </div>
        <div className="glass-card summary-card">
          <div className="summary-icon summary-icon-blue"><PackageCheck size={19} /></div>
          <div>
            <span className="summary-label">Units in Stock</span>
            <strong>{totalUnits}</strong>
          </div>
        </div>
        <div className="glass-card summary-card">
          <div className={`summary-icon ${lowStockCount ? 'summary-icon-warning' : 'summary-icon-success'}`}><AlertTriangle size={19} /></div>
          <div>
            <span className="summary-label">Low Stock Items</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>
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

      {/* Search and Filters */}
      <div className="glass-card mb-6 flex-between search-bar-wrapper">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="badge badge-indigo">{filteredProducts.length} items found</div>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent-indigo)', width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
          Loading products inventory...
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>SKU Code</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock Level</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-note">
                    {search ? 'No products match your search. Try another name or SKU.' : 'No products added yet. Use Add Product to begin tracking inventory.'}
                  </td>
                </tr>
              ) : filteredProducts.map((product) => {
                const isLowStock = product.quantity <= 10;
                const isOutOfStock = product.quantity === 0;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-details">
                        <span className="font-semibold text-primary">{product.name}</span>
                        <span className="text-muted text-xs">Product #{product.id}</span>
                      </div>
                    </td>
                    <td><span className="sku-code"><Barcode size={14} />{product.sku}</span></td>
                    <td className="text-right font-mono font-semibold">${product.price.toFixed(2)}</td>
                    <td className="text-right font-mono font-semibold">{product.quantity}</td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Healthy</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex-center gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="btn btn-secondary btn-icon"
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="btn btn-danger btn-icon"
                          title="Delete Product"
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
      )}

      {/* Modal Backdrop and Drawer */}
      {showForm && createPortal(
        <div className="modal-backdrop">
          <div className="glass-card modal-content animate-slide-up">
            <div className="modal-header">
              <h2 className="module-title">{editingProduct ? 'Edit Product Details' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-icon modal-close" aria-label="Close product form" title="Close product form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Unit Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity in Stock</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .mb-6 { margin-bottom: 1.5rem; }
        .pb-4 { padding-bottom: 1rem; }
        .border-b { border-bottom: 1px solid var(--border-glass); }
        .text-primary { color: var(--text-primary); }
        
        .search-bar-wrapper {
          padding: 0.75rem 1.5rem;
        }

        .inventory-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.125rem;
        }

        .summary-card strong, .summary-label {
          display: block;
        }

        .summary-card strong {
          margin-top: 0.2rem;
          font-family: var(--font-heading);
          font-size: 1.35rem;
        }

        .summary-label {
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .summary-icon {
          align-items: center;
          border-radius: 0.75rem;
          display: flex;
          height: 2.5rem;
          justify-content: center;
          width: 2.5rem;
        }

        .summary-icon-indigo { background: rgba(79, 70, 229, 0.08); color: var(--accent-indigo); }
        .summary-icon-blue { background: rgba(59, 130, 246, 0.08); color: var(--accent-violet); }
        .summary-icon-warning { background: var(--warning-glow); color: var(--warning); }
        .summary-icon-success { background: var(--success-glow); color: var(--success); }

        .product-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .text-xs {
          font-size: 0.75rem;
        }

        .sku-code {
          align-items: center;
          background: rgba(79, 70, 229, 0.06);
          border: 1px solid rgba(79, 70, 229, 0.12);
          border-radius: 999px;
          color: var(--accent-indigo);
          display: inline-flex;
          font-family: monospace;
          font-size: 0.78rem;
          font-weight: 700;
          gap: 0.35rem;
          padding: 0.3rem 0.55rem;
        }

        .search-input-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-grow: 1;
        }
        
        .search-icon {
          color: var(--text-muted);
        }
        
        .search-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          width: 100%;
          padding: 0.5rem 0;
        }
        
        .mt-6 { margin-top: 1.5rem; }

        @media (max-width: 768px) {
          .inventory-summary {
            grid-template-columns: 1fr;
          }

          .search-bar-wrapper {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
