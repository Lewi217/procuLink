import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import './Buyer.css';

const DEFAULT_ACTIVE_RFQS = [
  {
    id: 'RFQ-1048',
    parsed_material: 'Mild steel flat bars',
    parsed_quantity: 200,
    parsed_unit: 'kg',
    unit_price: 'KES 130/kg',
    pooled_quantity: 800,
    threshold_quantity: 1000,
    buyers_count: 8,
    closes_date: '10 Oct',
    status: 'POOLING'
  },
  {
    id: 'RFQ-1046',
    parsed_material: 'Galvanised roofing sheets',
    parsed_quantity: 20,
    parsed_unit: 'sheets',
    unit_price: 'KES 1,850/sheet',
    pooled_quantity: 60,
    threshold_quantity: 100,
    buyers_count: 4,
    closes_date: '11 Oct',
    status: 'POOLING'
  }
];

const DEFAULT_ORDERS = [
  {
    id: 'KE-0821',
    material: 'Angle bars',
    quantity: '100 kg',
    total: 'KES 15,300',
    status: 'LOCKED',
    dueText: 'today, 16:00'
  },
  {
    id: 'KE-0818',
    material: 'Steel plates',
    quantity: '50 kg',
    total: 'KES 8,300',
    status: 'FULFILLED'
  }
];

export default function BuyerOverview() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState(DEFAULT_ACTIVE_RFQS);
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await apiClient('/rfq/mine?page=1&page_size=20');
        if (isMounted && res?.data && res.data.length > 0) {
          // Map real RFQs and merge with defaults if needed
          const mapped = res.data.map(r => ({
            id: r.id ? `RFQ-${String(r.id).slice(0, 4).toUpperCase()}` : 'RFQ-NEW',
            parsed_material: r.parsed_material || r.raw_text,
            parsed_quantity: r.parsed_quantity || 100,
            parsed_unit: r.parsed_unit || 'kg',
            unit_price: 'KES 130/kg',
            pooled_quantity: r.status === 'LOCKED' ? 1000 : 800,
            threshold_quantity: 1000,
            buyers_count: 6,
            closes_date: '15 Oct',
            status: r.status || 'POOLING'
          }));
          setRfqs(mapped);
        }
      } catch (e) {
        // Fall back seamlessly to mockup demo data
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const lockedOrder = orders.find(o => o.status === 'LOCKED');

  return (
    <div className="buyer-page">
      {/* Date & Location */}
      <div className="page-header">
        <div className="breadcrumb">
          <span>09 OCT 2026</span>
          <span className="sep">/</span>
          <span>NAIROBI, KE</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">YOUR PROCUREMENT</h1>
          <button className="btn-primary" onClick={() => navigate('/buyer/rfqs')}>
            <Plus size={16} /> New RFQ
          </button>
        </div>
        <p className="page-subtitle">Buy together. Reach bulk prices faster.</p>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Active RFQs</span>
          <div className="stat-value-row">
            <span className="stat-value">02</span>
            <span className="stat-sub">POOLING</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Open orders</span>
          <div className="stat-value-row">
            <span className="stat-value">02</span>
            <span className="stat-sub">IN PROGRESS</span>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <span className="stat-label">KES saved¹</span>
          <div className="stat-value-row">
            <span className="stat-value accent">8,500</span>
            <span className="stat-sub">THIS MONTH</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {lockedOrder && (
        <div className="alert-banner">
          <div className="alert-banner-left">
            <div className="alert-icon-circle">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="alert-title">Order locked. Payment needed.</div>
              <div className="alert-subtext">{lockedOrder.id} · {lockedOrder.total} due {lockedOrder.dueText}</div>
            </div>
          </div>
          <button 
            className="alert-btn"
            onClick={() => navigate(`/buyer/orders?order=${lockedOrder.id}`)}
          >
            View order &amp; pay →
          </button>
        </div>
      )}

      {/* Active RFQs Section */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 className="section-title">ACTIVE RFQs</h2>
        </div>
        <span className="section-count">{String(rfqs.length).padStart(2, '0')} REQUESTS</span>
      </div>

      <div className="rfq-cards-grid">
        {rfqs.map(rfq => {
          const pooled = rfq.pooled_quantity || 800;
          const threshold = rfq.threshold_quantity || 1000;
          const pct = Math.min(100, Math.round((pooled / threshold) * 100));
          const remaining = Math.max(0, threshold - pooled);

          return (
            <div key={rfq.id} className="rfq-card">
              <div className="rfq-card-header">
                <span className="rfq-ref">{rfq.id}</span>
                <span className="badge badge-pooling">POOLING</span>
              </div>

              <h3 className="rfq-material">{rfq.parsed_material}</h3>
              <p className="rfq-meta">
                Your request: {rfq.parsed_quantity} {rfq.parsed_unit} · {rfq.unit_price}
              </p>

              <div className="pool-bar-container">
                <div className="pool-bar-label">
                  <span>{pooled.toLocaleString()} / {threshold.toLocaleString()} {rfq.parsed_unit} pooled</span>
                  <span className="pool-pct">{pct}%</span>
                </div>
                <div className="pool-bar">
                  <div className="pool-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <p className="rfq-hint">
                {remaining} {rfq.parsed_unit} to bulk price · {rfq.buyers_count || 8} buyers · closes {rfq.closes_date || '10 Oct'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Order Register Section */}
      <div className="section-header" style={{ marginTop: '1.75rem' }}>
        <h2 className="section-title">ORDER REGISTER</h2>
        <Link to="/buyer/orders" className="view-all">View all →</Link>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>MATERIAL</th>
              <th>QUANTITY</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="mono">{order.id}</td>
                <td style={{ fontWeight: '500' }}>{order.material}</td>
                <td>{order.quantity}</td>
                <td style={{ fontWeight: '600' }}>{order.total}</td>
                <td>
                  <span className={`badge ${order.status === 'LOCKED' ? 'badge-locked' : 'badge-fulfilled'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <Link 
                    to={`/buyer/orders?order=${order.id}`} 
                    className={order.status === 'LOCKED' ? 'action-link-primary' : 'action-link'}
                  >
                    {order.status === 'LOCKED' ? 'Pay now →' : 'Track order →'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="footnote">
        ¹ Saved vs. individual rates on delivered orders this month.
      </p>
    </div>
  );
}
