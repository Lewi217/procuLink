import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Check, Smartphone, CheckCircle2, X 
} from 'lucide-react';
import './Buyer.css';

const SAMPLE_ORDERS = {
  'KE-0821': {
    id: 'KE-0821',
    status: 'LOCKED - UNPAID',
    material: 'MILD STEEL ANGLE BARS',
    specification: '50 x 50 x 6 mm · 6 m lengths',
    quantity: '100 kg',
    quantityNum: 100,
    unitPrice: 145,
    deliveryFee: 800,
    total: 15300,
    supplier: 'Nairobi Steel Supply',
    deliveryAddress: 'Industrial Area, Nairobi',
    estimatedDelivery: '12 Oct 2026',
    phone: '+254 712 345 678',
    dueTime: 'TODAY / 16:00',
    milestones: {
      pooled: { date: '08 Oct · 14:20', detail: '1,000 / 1,000 kg · 10 buyers', completed: true },
      locked: { date: '09 Oct · 09:10', detail: 'Bulk price secured at KES 145/kg', completed: true },
      paid: { status: 'NEXT ACTION', detail: 'Awaiting your M-Pesa payment', completed: false, active: true },
      fulfilled: { status: 'After payment', detail: 'Supplier prepares your 100 kg', completed: false },
      delivered: { status: 'Est. 12 Oct', detail: 'Industrial Area, Nairobi', completed: false }
    }
  },
  'KE-0818': {
    id: 'KE-0818',
    status: 'FULFILLED',
    material: 'STEEL PLATES',
    specification: 'Mild steel · 3 mm thickness',
    quantity: '50 kg',
    quantityNum: 50,
    unitPrice: 150,
    deliveryFee: 800,
    total: 8300,
    supplier: 'Nairobi Steel Supply',
    deliveryAddress: 'Industrial Area, Nairobi',
    estimatedDelivery: '05 Oct 2026',
    phone: '+254 712 345 678',
    dueTime: 'COMPLETED',
    milestones: {
      pooled: { date: '01 Oct · 11:00', detail: '500 / 500 kg · 6 buyers', completed: true },
      locked: { date: '02 Oct · 10:30', detail: 'Bulk price secured at KES 150/kg', completed: true },
      paid: { status: '02 Oct · 11:15', detail: 'M-Pesa payment verified (KES 8,300)', completed: true },
      fulfilled: { status: '04 Oct · 14:00', detail: 'Ready for delivery from warehouse', completed: true },
      delivered: { status: '05 Oct · 16:30', detail: 'Delivered to Industrial Area', completed: true }
    }
  }
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('order') || 'KE-0821';
  
  const [currentOrder, setCurrentOrder] = useState(() => 
    SAMPLE_ORDERS[orderIdParam] || SAMPLE_ORDERS['KE-0821']
  );

  const [phone, setPhone] = useState(() => (SAMPLE_ORDERS[orderIdParam] || SAMPLE_ORDERS['KE-0821']).phone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaPin, setMpesaPin] = useState('');
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [viewAllOrders, setViewAllOrders] = useState(false);

  const handleSimulatePayment = () => {
    setMpesaProcessing(true);
    setTimeout(() => {
      setMpesaProcessing(false);
      setPaymentSuccess(true);
      
      // Update order state
      setCurrentOrder(prev => ({
        ...prev,
        status: 'PAID - FULFILLING',
        milestones: {
          ...prev.milestones,
          paid: { status: 'COMPLETED', detail: `Paid via M-Pesa (${phone})`, completed: true, active: false },
          fulfilled: { status: 'NEXT ACTION', detail: 'Supplier preparing order', completed: false, active: true }
        }
      }));

      setTimeout(() => {
        setShowMpesaModal(false);
        setPaymentSuccess(false);
      }, 1800);
    }, 1200);
  };

  return (
    <div className="buyer-page">
      {/* Header & Breadcrumb */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="breadcrumb">
            <button 
              type="button" 
              className="breadcrumb-back-btn" 
              onClick={() => setViewAllOrders(!viewAllOrders)}
            >
              <ArrowLeft size={14} />
              <span>ALL ORDERS</span>
            </button>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{currentOrder.id}</span>
          </div>

          <button 
            type="button"
            className="btn-toggle-orders"
            onClick={() => setViewAllOrders(!viewAllOrders)}
          >
            {viewAllOrders ? 'Hide Orders List' : 'Switch Order ▾'}
          </button>
        </div>

        <div className="page-title-row">
          <h1 className="page-title">TRACK YOUR ORDER</h1>
          <div className="order-status-badge-group">
            <span className="mono-ref">{currentOrder.id}</span>
            <span className={currentOrder.status.includes('LOCKED') ? 'badge-locked-unpaid' : 'badge-fulfilled'}>
              {currentOrder.status}
            </span>
          </div>
        </div>

        <p className="page-subtitle">
          {currentOrder.status.includes('LOCKED') 
            ? 'Your bulk price is secured. Complete payment to release your order.' 
            : 'Order confirmed and progressing through fulfillment.'}
        </p>
      </div>

      {/* Switch Order Dropdown Drawer if toggled */}
      {viewAllOrders && (
        <div className="orders-selector-drawer">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Select an Order to Track:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Object.values(SAMPLE_ORDERS).map(o => (
              <div 
                key={o.id}
                className={`order-switch-card ${o.id === currentOrder.id ? 'active' : ''}`}
                onClick={() => { setCurrentOrder(o); setPhone(o.phone); setViewAllOrders(false); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-ref">{o.id}</span>
                  <span className={`badge ${o.status.includes('LOCKED') ? 'badge-locked' : 'badge-fulfilled'}`}>{o.status}</span>
                </div>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{o.material}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.quantity} · KES {o.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Milestones Stepper (Screenshot 3 top) */}
      <div className="milestones-card">
        <div className="milestones-top-header">
          <span className="milestones-title">ORDER MILESTONES</span>
          <span className="milestones-ratio">
            {currentOrder.status.includes('PAID') ? '3 / 5 COMPLETE' : (currentOrder.status === 'FULFILLED' ? '5 / 5 COMPLETE' : '2 / 5 COMPLETE')}
          </span>
        </div>

        <div className="stepper-horizontal">
          {/* Step 1: Pooled */}
          <div className="stepper-node completed">
            <div className="node-icon-box completed">
              <Check size={14} strokeWidth={3} />
            </div>
            <div className="node-content">
              <span className="node-step-title">01 Pooled</span>
              <span className="node-timestamp">{currentOrder.milestones.pooled.date}</span>
              <span className="node-detail">{currentOrder.milestones.pooled.detail}</span>
            </div>
          </div>

          <div className="stepper-connector completed" />

          {/* Step 2: Locked */}
          <div className="stepper-node completed">
            <div className="node-icon-box completed">
              <Check size={14} strokeWidth={3} />
            </div>
            <div className="node-content">
              <span className="node-step-title">02 Locked</span>
              <span className="node-timestamp">{currentOrder.milestones.locked.date}</span>
              <span className="node-detail">{currentOrder.milestones.locked.detail}</span>
            </div>
          </div>

          <div className={`stepper-connector ${currentOrder.milestones.paid.completed ? 'completed' : ''}`} />

          {/* Step 3: Paid */}
          <div className={`stepper-node ${currentOrder.milestones.paid.completed ? 'completed' : 'active'}`}>
            <div className={`node-icon-box ${currentOrder.milestones.paid.completed ? 'completed' : 'active-outline'}`}>
              {currentOrder.milestones.paid.completed ? <Check size={14} strokeWidth={3} /> : '03'}
            </div>
            <div className="node-content">
              <span className="node-step-title">Paid</span>
              <span className={`node-timestamp ${!currentOrder.milestones.paid.completed ? 'node-action-accent' : ''}`}>
                {currentOrder.milestones.paid.status}
              </span>
              <span className="node-detail">{currentOrder.milestones.paid.detail}</span>
            </div>
          </div>

          <div className={`stepper-connector ${currentOrder.milestones.fulfilled.completed ? 'completed' : ''}`} />

          {/* Step 4: Fulfilled */}
          <div className={`stepper-node ${currentOrder.milestones.fulfilled.completed ? 'completed' : 'pending'}`}>
            <div className={`node-icon-box ${currentOrder.milestones.fulfilled.completed ? 'completed' : 'pending'}`}>
              {currentOrder.milestones.fulfilled.completed ? <Check size={14} strokeWidth={3} /> : '04'}
            </div>
            <div className="node-content">
              <span className="node-step-title">Fulfilled</span>
              <span className="node-timestamp">{currentOrder.milestones.fulfilled.status}</span>
              <span className="node-detail">{currentOrder.milestones.fulfilled.detail}</span>
            </div>
          </div>

          <div className={`stepper-connector ${currentOrder.milestones.delivered?.completed ? 'completed' : ''}`} />

          {/* Step 5: Delivered */}
          <div className={`stepper-node ${currentOrder.milestones.delivered?.completed ? 'completed' : 'pending'}`}>
            <div className={`node-icon-box ${currentOrder.milestones.delivered?.completed ? 'completed' : 'pending'}`}>
              {currentOrder.milestones.delivered?.completed ? <Check size={14} strokeWidth={3} /> : '05'}
            </div>
            <div className="node-content">
              <span className="node-step-title">Delivered</span>
              <span className="node-timestamp">{currentOrder.milestones.delivered?.status}</span>
              <span className="node-detail">{currentOrder.milestones.delivered?.detail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="two-col-layout">
        {/* Left Column: Order Details & Delivery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Order Details Card */}
          <div className="order-details-box">
            <div className="card-top-header-sub">
              <span>ORDER DETAILS</span>
              <span className="sep">/</span>
              <span>{currentOrder.id}</span>
            </div>

            <h2 className="order-item-title">{currentOrder.material}</h2>
            <p className="order-item-spec">{currentOrder.specification}</p>

            <div className="order-item-qty">{currentOrder.quantity}</div>

            <div className="order-supplier-row">
              <span className="order-field-label">Supplier</span>
              <span className="order-field-val" style={{ fontWeight: '600' }}>{currentOrder.supplier}</span>
            </div>
          </div>

          {/* Delivery & Fulfilment Card */}
          <div className="order-delivery-box">
            <h3 className="card-subhead">DELIVERY &amp; FULFILMENT</h3>

            <div className="delivery-grid">
              <div className="delivery-col">
                <span className="order-field-label">Deliver to</span>
                <span className="order-field-val">{currentOrder.deliveryAddress}</span>
              </div>

              <div className="delivery-col">
                <span className="order-field-label">Estimated delivery</span>
                <span className="order-field-val">{currentOrder.estimatedDelivery}</span>
              </div>
            </div>

            <p className="delivery-hint-note">
              Supplier prepares your {currentOrder.quantity} after payment.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Questions about this order?</span>
            <button 
              type="button" 
              className="btn-link-action"
              onClick={() => alert(`Connecting you to ${currentOrder.supplier}:\nPhone: +254 722 000 111\nEmail: orders@nairobisteel.co.ke`)}
            >
              Contact supplier →
            </button>
          </div>
        </div>

        {/* Right Column: Payment Due Card (Orange Bordered) */}
        <div className="payment-due-card">
          <div className="payment-card-header">
            <span className="payment-card-title">PAYMENT DUE</span>
            <span className="payment-due-badge">{currentOrder.dueTime}</span>
          </div>

          <div className="payment-line-items">
            <div className="payment-line">
              <span>{currentOrder.quantity} x KES {currentOrder.unitPrice}</span>
              <span className="payment-amount">KES {(currentOrder.quantityNum * currentOrder.unitPrice).toLocaleString()}</span>
            </div>

            <div className="payment-line">
              <span>Delivery to {currentOrder.deliveryAddress.split(',')[0]}</span>
              <span className="payment-amount">KES {currentOrder.deliveryFee.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-divider" />

          <div className="payment-total-block">
            <span className="payment-vat-label">Total to pay · VAT included</span>
            <div className="payment-total-big">
              KES {currentOrder.total.toLocaleString()}
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="mpesa-phone-box">
            {isEditingPhone ? (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <input
                  type="text"
                  className="input-styled"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                />
                <button 
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setIsEditingPhone(false)}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <span className="phone-text">{phone}</span>
                <button 
                  type="button" 
                  className="phone-change-btn"
                  onClick={() => setIsEditingPhone(true)}
                >
                  Change
                </button>
              </>
            )}
          </div>

          {/* Pay with M-Pesa Button */}
          {currentOrder.status.includes('PAID') ? (
            <div className="payment-completed-banner">
              <CheckCircle2 size={20} color="#10B981" />
              <span>Payment Completed · Order Released</span>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-mpesa-pay"
              onClick={() => setShowMpesaModal(true)}
            >
              <Smartphone size={18} />
              <span>Pay with M-Pesa</span>
            </button>
          )}

          <p className="mpesa-disclaimer">
            An M-Pesa prompt will be sent to your phone. Enter your PIN on your phone to confirm.
          </p>
        </div>
      </div>

      {/* M-Pesa STK Push Simulator Modal */}
      {showMpesaModal && (
        <div className="modal-overlay">
          <div className="mpesa-modal-card">
            <div className="mpesa-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="mpesa-dot" />
                <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '0.04em' }}>LIPA NA M-PESA ONLINE</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMpesaModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {paymentSuccess ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} color="#10B981" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Payment Received!</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Ref: QKE8912349 · KES {currentOrder.total.toLocaleString()} confirmed from {phone}.
                </p>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYBILL / BUSINESS:</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem' }}>ProcuLink JUMUA Escrow (982001)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>AMOUNT:</div>
                  <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)' }}>KES {currentOrder.total.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>PHONE PROMPT TARGET:</div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{phone}</div>
                </div>

                <div className="field-group">
                  <label>Enter M-Pesa PIN on phone simulator:</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="input-styled"
                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                    placeholder="••••"
                    value={mpesaPin}
                    onChange={(e) => setMpesaPin(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
                  onClick={handleSimulatePayment}
                  disabled={mpesaProcessing}
                >
                  {mpesaProcessing ? 'Processing STK Prompt...' : 'Send M-Pesa PIN & Authorize'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
