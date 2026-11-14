import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListFilter } from 'lucide-react';
import { apiClient } from '../../api/client';
import '../buyer/Buyer.css';
import './Supplier.css';

const DEFAULT_CATALOG = [
  {
    id: 'mat-1',
    name: 'Flat bars',
    specification: '40 x 6 mm · 6 m',
    availableStock: '2,400 kg in stock',
    pricePerUnit: '130 / kg',
    bulkMin: '1,000 kg',
    status: 'LIVE'
  },
  {
    id: 'mat-2',
    name: 'Angle bars',
    specification: '50 x 50 x 6 mm',
    availableStock: '1,800 kg in stock',
    pricePerUnit: '145 / kg',
    bulkMin: '1,000 kg',
    status: 'LIVE'
  },
  {
    id: 'mat-3',
    name: 'Roofing sheets',
    specification: 'Galvanised · 28G · 3 m',
    availableStock: '250 sheets in stock',
    pricePerUnit: '1,850 / sheet',
    bulkMin: '100 sheets',
    status: 'LIVE'
  },
  {
    id: 'mat-4',
    name: 'Steel plates',
    specification: 'Mild steel · 3 mm',
    availableStock: '1,200 kg in stock',
    pricePerUnit: '150 / kg',
    bulkMin: '500 kg',
    status: 'LIVE'
  }
];

const DEFAULT_INCOMING_POOLS = [
  {
    id: 'POOL-FB-102',
    title: 'Mild steel flat bars',
    pooled: 800,
    threshold: 1000,
    unit: 'kg',
    buyers: 8,
    totalValue: 'KES 104,000',
    closes: '10 Oct',
    status: 'POOLING'
  },
  {
    id: 'POOL-GS-047',
    title: 'Galvanised roofing sheets',
    pooled: 60,
    threshold: 100,
    unit: 'sheets',
    buyers: 4,
    totalValue: 'KES 111,000',
    closes: '11 Oct',
    status: 'POOLING'
  }
];

export default function SupplierOverview() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [incomingPools, setIncomingPools] = useState(DEFAULT_INCOMING_POOLS);
  const [selectedPoolModal, setSelectedPoolModal] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiClient('/catalog?pageSize=10')
      .then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          // If real backend items exist, adapt them into catalog table
          const mapped = res.data.slice(0, 4).map(item => ({
            id: item.id,
            name: item.name,
            specification: `${item.category} standard`,
            availableStock: `${item.stock_quantity?.toLocaleString() || 1000} ${item.unit?.toLowerCase()} in stock`,
            pricePerUnit: `${item.bulk_price_per_unit || 130} / ${item.unit?.toLowerCase()}`,
            bulkMin: `${item.bulk_threshold_quantity?.toLocaleString() || 500} ${item.unit?.toLowerCase()}`,
            status: item.is_active !== false ? 'LIVE' : 'DRAFT'
          }));
          if (mapped.length > 0) setCatalog(mapped);
        }
      })
      .catch(() => {});

    apiClient('/pools?pageSize=10')
      .then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          // Can merge live pools here
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="supplier-page">
      {/* Date & Title */}
      <div className="page-header">
        <div className="breadcrumb">
          <span>09 OCT 2026</span>
          <span className="sep">/</span>
          <span>NAIROBI, KE</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">SUPPLY OPERATIONS</h1>
          <button className="btn-secondary" onClick={() => navigate('/supplier/catalog')}>
            <ListFilter size={16} /> Manage catalog
          </button>
        </div>
        <p className="page-subtitle">Monitor pooled demand. Keep your stock moving.</p>
      </div>

      {/* 3 Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Filling pools</span>
          <div className="stat-value-row">
            <span className="stat-value">02</span>
            <span className="stat-sub">ACCEPTING RFQS</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Live materials</span>
          <div className="stat-value-row">
            <span className="stat-value">04</span>
            <span className="stat-sub">IN CATALOG</span>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <span className="stat-label">Locked pool</span>
          <div className="stat-value-row">
            <span className="stat-value accent">01</span>
            <span className="stat-sub">PAYMENT PENDING</span>
          </div>
        </div>
      </div>

      {/* Material Catalog Section */}
      <div className="section-header">
        <h2 className="section-title">MATERIAL CATALOG</h2>
        <Link to="/supplier/catalog" className="view-all">Manage →</Link>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>SPECIFICATION</th>
              <th>AVAILABLE STOCK</th>
              <th>KES / UNIT</th>
              <th>BULK MIN.</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: '600' }}>{item.name}</td>
                <td>{item.specification}</td>
                <td>{item.availableStock}</td>
                <td style={{ fontWeight: '600' }}>{item.pricePerUnit}</td>
                <td>{item.bulkMin}</td>
                <td>
                  <span className="badge badge-fulfilled">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        Bulk rates include VAT. Delivery priced per buyer.
      </p>

      {/* Incoming Demand & Locked Pool Section */}
      <div className="demand-pool-grid">
        {/* Left Column: Incoming Demand (2 Pools) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="section-header" style={{ marginTop: 0 }}>
            <h2 className="section-title">INCOMING DEMAND</h2>
            <span className="section-count">02 POOLS</span>
          </div>

          <div className="incoming-demand-cards">
            {incomingPools.map(pool => {
              const pct = Math.round((pool.pooled / pool.threshold) * 100);
              return (
                <div key={pool.id} className="rfq-card">
                  <div className="rfq-card-header">
                    <span className="rfq-ref">{pool.id}</span>
                    <span className="badge badge-pooling">POOLING</span>
                  </div>

                  <h3 className="rfq-material">{pool.title}</h3>

                  <div className="pool-bar-container" style={{ margin: '0.25rem 0' }}>
                    <div className="pool-bar-label">
                      <span>{pool.pooled.toLocaleString()} / {pool.threshold.toLocaleString()} {pool.unit} pooled</span>
                      <span className="pool-pct">{pct}%</span>
                    </div>
                    <div className="pool-bar">
                      <div className="pool-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <p className="rfq-hint">
                    {pool.buyers} buyers · {pool.totalValue} · closes {pool.closes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Locked Pool (01 Pool) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="section-header" style={{ marginTop: 0 }}>
            <h2 className="section-title">LOCKED POOL</h2>
            <span className="section-count">01 POOL</span>
          </div>

          <div className="locked-pool-card">
            <div className="locked-pool-card-header">
              <span className="rfq-ref">POOL-AB-006</span>
              <span className="badge badge-locked">LOCKED</span>
            </div>

            <div className="locked-pool-title">ANGLE BARS · 1,000 kg</div>

            <div className="locked-pool-price-row">
              <span className="locked-pool-price">KES 145,000</span>
              <span className="locked-pool-buyers">10 buyers</span>
            </div>

            <div className="locked-pool-notice">
              9 of 10 buyers paid. Kamau Fabricators' order KF-0821 awaits payment. Dispatch after all payments.
            </div>

            <button 
              type="button" 
              className="btn-view-pool-orders"
              onClick={() => setSelectedPoolModal('POOL-AB-006')}
            >
              View pool orders →
            </button>
          </div>
        </div>
      </div>

      {/* Pool Orders Modal */}
      {selectedPoolModal && (
        <div className="modal-overlay">
          <div className="catalog-modal">
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="rfq-ref">POOL-AB-006</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: '0.25rem' }}>ANGLE BARS · 1,000 kg Orders</h3>
              </div>
              <button 
                onClick={() => setSelectedPoolModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                10 buyer orders in this batch (KES 145,000 Total):
              </div>
              
              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px' }}>
                  <span><strong>KF-0821</strong> · Kamau Fabricators (100 kg)</span>
                  <span style={{ color: '#EF4444', fontWeight: '600' }}>PENDING (KES 14,500)</span>
                </div>
                {[
                  { id: 'MW-0112', buyer: 'Mwananchi Welds', qty: '150 kg' },
                  { id: 'JD-0402', buyer: 'Jua Kali Designs', qty: '100 kg' },
                  { id: 'ST-0931', buyer: 'SteelTech Fabricators', qty: '200 kg' },
                  { id: 'ER-0094', buyer: 'Eastern Roofers', qty: '100 kg' },
                  { id: 'NB-0551', buyer: 'Nairobi Gates Ltd', qty: '150 kg' },
                  { id: 'WK-0283', buyer: 'Wakulima Metal Works', qty: '200 kg' }
                ].map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}>
                    <span>{b.id} · {b.buyer} ({b.qty})</span>
                    <span style={{ color: '#10B981', fontWeight: '600' }}>PAID ✓</span>
                  </div>
                ))}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => {
                  alert("Dispatch batch notification sent to logistics for Industrial Area warehousing.");
                  setSelectedPoolModal(null);
                }}
              >
                Prepare Dispatch Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
