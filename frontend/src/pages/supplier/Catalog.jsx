import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Check } from 'lucide-react';
import { apiClient } from '../../api/client';
import '../buyer/Buyer.css';
import './Supplier.css';

const INITIAL_CATALOG = [
  {
    id: 'mat-1',
    name: 'Flat bars',
    category: 'METAL',
    specification: '40 x 6 mm · 6 m',
    unit: 'KG',
    retailPrice: 160,
    bulkPrice: 130,
    bulkThreshold: 1000,
    stockQuantity: 2400,
    status: 'LIVE'
  },
  {
    id: 'mat-2',
    name: 'Angle bars',
    category: 'METAL',
    specification: '50 x 50 x 6 mm',
    unit: 'KG',
    retailPrice: 175,
    bulkPrice: 145,
    bulkThreshold: 1000,
    stockQuantity: 1800,
    status: 'LIVE'
  },
  {
    id: 'mat-3',
    name: 'Roofing sheets',
    category: 'METAL',
    specification: 'Galvanised · 28G · 3 m',
    unit: 'SHEET',
    retailPrice: 2200,
    bulkPrice: 1850,
    bulkThreshold: 100,
    stockQuantity: 250,
    status: 'LIVE'
  },
  {
    id: 'mat-4',
    name: 'Steel plates',
    category: 'METAL',
    specification: 'Mild steel · 3 mm',
    unit: 'KG',
    retailPrice: 180,
    bulkPrice: 150,
    bulkThreshold: 500,
    stockQuantity: 1200,
    status: 'LIVE'
  }
];

export default function SupplierCatalog() {
  const [items, setItems] = useState(INITIAL_CATALOG);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'METAL',
    unit: 'KG',
    retail_price_per_unit: '',
    bulk_price_per_unit: '',
    bulk_threshold_quantity: '',
    stock_quantity: ''
  });

  useEffect(() => {
    let isMounted = true;
    apiClient('/catalog?pageSize=50')
      .then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          const mapped = res.data.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            specification: `${i.category} grade standard`,
            unit: i.unit,
            retailPrice: Number(i.retail_price_per_unit),
            bulkPrice: Number(i.bulk_price_per_unit),
            bulkThreshold: i.bulk_threshold_quantity,
            stockQuantity: i.stock_quantity,
            status: i.is_active !== false ? 'LIVE' : 'DRAFT'
          }));
          setItems(mapped);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: newItem.name,
        category: newItem.category,
        unit: newItem.unit,
        retail_price_per_unit: Number(newItem.retail_price_per_unit),
        bulk_price_per_unit: Number(newItem.bulk_price_per_unit),
        bulk_threshold_quantity: Number(newItem.bulk_threshold_quantity),
        stock_quantity: Number(newItem.stock_quantity || 0)
      };

      const res = await apiClient('/catalog', {
        method: 'POST',
        body: payload
      });

      const added = {
        id: res?.data?.id || `mat-${Date.now()}`,
        name: newItem.name,
        category: newItem.category,
        specification: `${newItem.category} · Standard`,
        unit: newItem.unit,
        retailPrice: Number(newItem.retail_price_per_unit),
        bulkPrice: Number(newItem.bulk_price_per_unit),
        bulkThreshold: Number(newItem.bulk_threshold_quantity),
        stockQuantity: Number(newItem.stock_quantity || 0),
        status: 'LIVE'
      };

      setItems([added, ...items]);
      setShowAddModal(false);
      setNotification('New material successfully added to your catalog!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      // Local fallback
      const added = {
        id: `mat-${Date.now()}`,
        name: newItem.name,
        category: newItem.category,
        specification: `${newItem.category} · Standard`,
        unit: newItem.unit,
        retailPrice: Number(newItem.retail_price_per_unit),
        bulkPrice: Number(newItem.bulk_price_per_unit),
        bulkThreshold: Number(newItem.bulk_threshold_quantity),
        stockQuantity: Number(newItem.stock_quantity || 0),
        status: 'LIVE'
      };
      setItems([added, ...items]);
      setShowAddModal(false);
      setNotification('Material added to catalog.');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.specification?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="supplier-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span>SUPPLIER WORKSPACE</span>
          <span className="sep">/</span>
          <span>CATALOG MANAGEMENT</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">MATERIAL CATALOG</h1>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Material
          </button>
        </div>
        <p className="page-subtitle">Publish items, manage stock and set pooled bulk thresholds.</p>
      </div>

      {notification && (
        <div className="alert-banner" style={{ borderColor: 'var(--primary)' }}>
          <Check size={18} color="var(--primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-styled"
            style={{ width: '100%', paddingLeft: '2.25rem' }}
            placeholder="Search material by name or specification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>CATEGORY</th>
              <th>AVAILABLE STOCK</th>
              <th>RETAIL RATE</th>
              <th>BULK RATE</th>
              <th>BULK THRESHOLD</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.specification}</div>
                </td>
                <td><span className="badge badge-default">{item.category}</span></td>
                <td>{item.stockQuantity?.toLocaleString()} {item.unit?.toLowerCase()}</td>
                <td style={{ color: 'var(--text-muted)' }}>KES {item.retailPrice} / {item.unit?.toLowerCase()}</td>
                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>KES {item.bulkPrice} / {item.unit?.toLowerCase()}</td>
                <td>{item.bulkThreshold?.toLocaleString()} {item.unit?.toLowerCase()}</td>
                <td><span className="badge badge-fulfilled">{item.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Edit stock"
                      onClick={() => {
                        const newStock = prompt(`Update stock for ${item.name}:`, item.stockQuantity);
                        if (newStock) {
                          setItems(items.map(i => i.id === item.id ? { ...i, stockQuantity: Number(newStock) } : i));
                        }
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="catalog-modal">
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Add Material to Catalog</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field-group">
                <label>Material Name</label>
                <input
                  required
                  className="input-styled"
                  placeholder="e.g. Mild steel flat bars"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="field-group">
                  <label>Category</label>
                  <select
                    className="input-styled"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option value="METAL">METAL</option>
                    <option value="TIMBER">TIMBER</option>
                    <option value="PACKAGING">PACKAGING</option>
                    <option value="CHEMICAL">CHEMICAL</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Unit of Measure</label>
                  <select
                    className="input-styled"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  >
                    <option value="KG">KG</option>
                    <option value="SHEET">SHEET</option>
                    <option value="PIECE">PIECE</option>
                    <option value="METER">METER</option>
                    <option value="BAG">BAG</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="field-group">
                  <label>Retail Price (KES)</label>
                  <input
                    type="number"
                    required
                    className="input-styled"
                    placeholder="e.g. 160"
                    value={newItem.retail_price_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, retail_price_per_unit: e.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label>Bulk Price (KES)</label>
                  <input
                    type="number"
                    required
                    className="input-styled"
                    placeholder="e.g. 130"
                    value={newItem.bulk_price_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, bulk_price_per_unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="field-group">
                  <label>Bulk Threshold Min</label>
                  <input
                    type="number"
                    required
                    className="input-styled"
                    placeholder="e.g. 1000"
                    value={newItem.bulk_threshold_quantity}
                    onChange={(e) => setNewItem({ ...newItem, bulk_threshold_quantity: e.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label>Available Stock</label>
                  <input
                    type="number"
                    className="input-styled"
                    placeholder="e.g. 2400"
                    value={newItem.stock_quantity}
                    onChange={(e) => setNewItem({ ...newItem, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Adding to Catalog...' : 'Save & Publish Material'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
