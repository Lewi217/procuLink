import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { apiClient } from '../../api/client';
import '../buyer/Buyer.css';
import './Supplier.css';

const DEMAND_POOLS = [
  {
    id: 'POOL-FB-102',
    material: 'Mild steel flat bars',
    supplier: 'Nairobi Steel Supply',
    pooledQuantity: 800,
    thresholdQuantity: 1000,
    unit: 'kg',
    unitPrice: 130,
    totalValue: 104000,
    buyersCount: 8,
    closesDate: '10 Oct 2026',
    status: 'POOLING'
  },
  {
    id: 'POOL-GS-047',
    material: 'Galvanised roofing sheets',
    supplier: 'Nairobi Steel Supply',
    pooledQuantity: 60,
    thresholdQuantity: 100,
    unit: 'sheets',
    unitPrice: 1850,
    totalValue: 111000,
    buyersCount: 4,
    closesDate: '11 Oct 2026',
    status: 'POOLING'
  },
  {
    id: 'POOL-AB-006',
    material: 'Angle bars',
    supplier: 'Nairobi Steel Supply',
    pooledQuantity: 1000,
    thresholdQuantity: 1000,
    unit: 'kg',
    unitPrice: 145,
    totalValue: 145000,
    buyersCount: 10,
    closesDate: '09 Oct 2026',
    status: 'LOCKED',
    paidCount: 9
  }
];

export default function SupplierDemand() {
  const [pools, setPools] = useState(DEMAND_POOLS);
  const [lockingId, setLockingId] = useState(null);

  const handleLockPool = async (poolId) => {
    setLockingId(poolId);
    try {
      await apiClient(`/pools/${poolId}/lock`, { method: 'POST' });
    } catch (e) {
      // Local simulated lock
    }
    setPools(pools.map(p => p.id === poolId ? { ...p, status: 'LOCKED' } : p));
    setLockingId(null);
  };

  return (
    <div className="supplier-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span>SUPPLIER WORKSPACE</span>
          <span className="sep">/</span>
          <span>POOLED DEMAND</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">DEMAND AGGREGATION</h1>
        </div>
        <p className="page-subtitle">Track incoming RFQ pools, monitor contributor counts, and manage bulk lock triggers.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Active Demand Pools</span>
          <div className="stat-value-row">
            <span className="stat-value">03</span>
            <span className="stat-sub">AGGREGATING</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Contributing Buyers</span>
          <div className="stat-value-row">
            <span className="stat-value">22</span>
            <span className="stat-sub">JUA KALI FABRICATORS</span>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <span className="stat-label">Total Pipeline Value</span>
          <div className="stat-value-row">
            <span className="stat-value accent">360K</span>
            <span className="stat-sub">KES PENDING/LOCKED</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">AGGREGATION POOLS</h2>
        <span className="section-count">{pools.length} ACTIVE POOLS</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pools.map(pool => {
          const pct = Math.min(100, Math.round((pool.pooledQuantity / pool.thresholdQuantity) * 100));
          const isLocked = pool.status === 'LOCKED';

          return (
            <div 
              key={pool.id} 
              className="rfq-card" 
              style={{ borderColor: isLocked ? 'rgba(249, 115, 22, 0.4)' : 'var(--border-color)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="rfq-ref">{pool.id}</span>
                    <span className={`badge ${isLocked ? 'badge-locked' : 'badge-pooling'}`}>
                      {pool.status}
                    </span>
                  </div>
                  <h3 className="rfq-material" style={{ marginTop: '0.25rem' }}>{pool.material}</h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace' }}>
                    KES {pool.totalValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {pool.buyersCount} buyers participating
                  </div>
                </div>
              </div>

              <div className="pool-bar-container" style={{ margin: '0.5rem 0' }}>
                <div className="pool-bar-label">
                  <span>{pool.pooledQuantity.toLocaleString()} / {pool.thresholdQuantity.toLocaleString()} {pool.unit} pooled</span>
                  <span className="pool-pct">{pct}%</span>
                </div>
                <div className="pool-bar">
                  <div className="pool-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Closes: {pool.closesDate} · Rate: KES {pool.unitPrice} / {pool.unit}
                </div>

                {!isLocked && (
                  <button 
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleLockPool(pool.id)}
                    disabled={lockingId === pool.id}
                  >
                    <Lock size={12} />
                    {lockingId === pool.id ? 'Locking...' : 'Lock Pool & Trigger Payments'}
                  </button>
                )}

                {isLocked && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                    {pool.paidCount || 9} of {pool.buyersCount} buyers paid
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
