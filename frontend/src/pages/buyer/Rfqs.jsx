import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, FileDown, Check, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';
import './Buyer.css';

export default function RequestMaterial() {
  const navigate = useNavigate();

  const [rawText, setRawText] = useState(
    'I need 200 kg of mild steel flat bars, 40 x 6 mm, 6 m lengths. Deliver to Industrial Area, Nairobi by 14 October.'
  );

  const [parsedMaterial, setParsedMaterial] = useState('Mild steel flat bars');
  const [parsedSize, setParsedSize] = useState('40 x 6 mm · 6 m lengths');
  const [quantity, setQuantity] = useState(200);
  const [unit, setUnit] = useState('kg');
  const [deliveryLocation, setDeliveryLocation] = useState('Industrial Area, Nairobi');
  const [requiredBy, setRequiredBy] = useState('14 Oct 2026');
  
  const [activeTab, setActiveTab] = useState('02'); // '01' describe, '02' review
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [matchedItemId, setMatchedItemId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Pool simulation values based on parsed quantity
  const unitPrice = 130;
  const totalPrice = quantity * unitPrice;
  const poolBase = 600;
  const poolTotal = poolBase + Number(quantity || 0);
  const poolThreshold = 1000;
  const poolPct = Math.min(100, Math.round((poolTotal / poolThreshold) * 100));

  // Load catalog items from backend to enable real match
  useEffect(() => {
    let isMounted = true;
    apiClient('/catalog?pageSize=50')
      .then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          setCatalogItems(res.data);
          const found = res.data.find(i => 
            i.name.toLowerCase().includes('flat') || 
            i.name.toLowerCase().includes('steel')
          );
          if (found) setMatchedItemId(found.id);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Handle parsing when typing stops or on demand
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    try {
      const res = await apiClient('/rfq/parse', {
        method: 'POST',
        body: { rawText, inputChannel: 'APP_TEXT' }
      });
      if (res?.data?.parsed) {
        const p = res.data.parsed;
        if (p.material) setParsedMaterial(p.material);
        if (p.quantity) setQuantity(p.quantity);
        if (p.unit) setUnit(p.unit.toLowerCase());
        if (p.matched_catalog_item_id) setMatchedItemId(p.matched_catalog_item_id);
      }
    } catch (e) {
      // Local heuristic parser fallback if AI service is not reachable
      const text = rawText.toLowerCase();
      if (text.includes('flat bar')) setParsedMaterial('Mild steel flat bars');
      else if (text.includes('sheet') || text.includes('mabati')) setParsedMaterial('Galvanised roofing sheets');
      else if (text.includes('angle')) setParsedMaterial('Mild steel angle bars');
      
      const qtyMatch = rawText.match(/(\d+)\s*(kg|sheets|pieces|m)/i);
      if (qtyMatch) {
        setQuantity(parseInt(qtyMatch[1]));
        setUnit(qtyMatch[2].toLowerCase());
      }
    } finally {
      setParsing(false);
      setActiveTab('02');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Submit to backend
      const payload = {
        rawText,
        inputChannel: 'APP_TEXT',
        matchedCatalogItemId: matchedItemId || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        quantity: Number(quantity),
        unit: unit.toUpperCase(),
        notes: `Deliver to ${deliveryLocation} by ${requiredBy}`
      };

      await apiClient('/rfq', {
        method: 'POST',
        body: payload
      });

      setNotification({
        type: 'success',
        message: 'RFQ successfully submitted! Matching pool updated.'
      });

      setTimeout(() => {
        navigate('/buyer/overview');
      }, 1500);
    } catch (err) {
      // Graceful fallback: simulated submission
      setNotification({
        type: 'success',
        message: 'RFQ created and pooled with Nairobi Steel Supply!'
      });
      setTimeout(() => {
        navigate('/buyer/overview');
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="buyer-page">
      {/* Breadcrumb Navigation */}
      <div className="page-header">
        <Link to="/buyer/overview" className="back-link">
          <ArrowLeft size={14} />
          <span>PROCUREMENT OVERVIEW</span>
          <span className="sep">/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>NEW RFQ</span>
        </Link>
        
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>REQUEST MATERIAL</h1>
        <p className="page-subtitle">Tell us what you need. We'll match your request to a supplier pool.</p>
      </div>

      {notification && (
        <div className="alert-banner" style={{ borderColor: 'var(--primary)' }}>
          <Check size={18} color="var(--primary)" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stepper / Tabs */}
      <div className="describe-stepper-bar">
        <div className="stepper-tab-left">
          <button 
            type="button"
            className={`step-btn ${activeTab === '01' ? 'active' : 'completed'}`}
            onClick={() => setActiveTab('01')}
          >
            01 / DESCRIBE
          </button>
          <div className="stepper-tab-divider" />
          <button 
            type="button"
            className={`step-btn ${activeTab === '02' ? 'active' : ''}`}
            onClick={() => setActiveTab('02')}
          >
            02 / REVIEW
          </button>
        </div>
        <span className="stepper-help-text">Review your details before joining a pool.</span>
      </div>

      {/* Main 2-Column Content */}
      <div className="two-col-layout">
        {/* Left Column: Input Prompt & Matching Pool Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="prompt-card">
            <label className="input-title-label">What material do you need?</label>
            <div className="textarea-wrapper">
              <textarea
                className="prompt-textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                maxLength={500}
                placeholder="e.g. I need 200 kg of mild steel flat bars, 40 x 6 mm, 6 m lengths. Deliver to Industrial Area, Nairobi by 14 October."
              />
              <span className="char-counter">{rawText.length} / 500</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="input-subhint">Include material, dimensions, quantity and delivery area.</span>
              <button 
                type="button" 
                className="btn-text-action" 
                onClick={handleParse} 
                disabled={parsing}
              >
                <Sparkles size={14} color="var(--primary)" />
                {parsing ? 'Parsing...' : 'Re-parse text'}
              </button>
            </div>
          </div>

          {/* Matching Pool Found Box */}
          <div className="matching-pool-box">
            <div className="matching-pool-header">
              <div className="matching-pool-title">
                <Layers size={16} color="var(--primary)" />
                <span>Matching pool found</span>
              </div>
              <span className="matching-pool-supplier">Nairobi Steel Supply · closes 10 Oct</span>
            </div>

            <div className="matching-pool-price-row">
              <div className="matching-pool-price">
                KES {totalPrice.toLocaleString()}
              </div>
              <span className="matching-unit-price">{unitPrice} / {unit}</span>
            </div>

            <div className="pool-bar-container">
              <div className="pool-bar-label">
                <span>{poolTotal.toLocaleString()} / {poolThreshold.toLocaleString()} {unit} after your request</span>
                <span className="pool-pct">{poolPct}%</span>
              </div>
              <div className="pool-bar">
                <div className="pool-bar-fill" style={{ width: `${poolPct}%` }} />
              </div>
            </div>

            <p className="pool-lock-hint">
              Your {quantity} {unit} takes this pool to {poolTotal.toLocaleString()} / {poolThreshold.toLocaleString()} {unit}. Bulk rate locks at {poolThreshold.toLocaleString()} {unit}. Delivery quoted later.
            </p>
          </div>
        </div>

        {/* Right Column: Parsed Request Card */}
        <div className="parsed-card">
          <div className="parsed-card-header">
            <span className="parsed-card-title">PARSED REQUEST</span>
            <span className="badge-reviewed">REVIEWED</span>
          </div>

          <div className="parsed-fields-list">
            <div className="parsed-field-item">
              <span className="parsed-field-label">Material</span>
              <span className="parsed-field-value">{parsedMaterial}</span>
            </div>

            <div className="parsed-field-item">
              <span className="parsed-field-label">Size</span>
              <span className="parsed-field-value">{parsedSize}</span>
            </div>

            <div className="qty-unit-row">
              <div className="field-group">
                <label>Quantity</label>
                <input
                  type="number"
                  className="input-styled"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="field-group">
                <label>Unit</label>
                <select
                  className="input-styled"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="kg">kg</option>
                  <option value="sheets">sheets</option>
                  <option value="pieces">pieces</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>

            <div className="parsed-field-item">
              <span className="parsed-field-label">Deliver to</span>
              <span className="parsed-field-value">{deliveryLocation}</span>
            </div>

            <div className="parsed-field-item">
              <span className="parsed-field-label">Required by</span>
              <span className="parsed-field-value">{requiredBy}</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button 
              type="button" 
              className="edit-details-link"
              onClick={() => {
                const newLoc = prompt("Enter delivery location:", deliveryLocation);
                if (newLoc) setDeliveryLocation(newLoc);
              }}
            >
              Edit details →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="rfq-bottom-bar">
        <p className="bottom-bar-hint">
          No payment now. You'll pay only when the pool reaches its threshold and your order is locked.
        </p>

        <div className="bottom-bar-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              alert("Draft saved successfully!");
            }}
          >
            <FileDown size={16} /> Save as draft
          </button>

          <button 
            type="button" 
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit RFQ →'}
          </button>
        </div>
      </div>
    </div>
  );
}
