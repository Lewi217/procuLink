import React, { useState } from 'react';
import { Check, Save } from 'lucide-react';
import './Buyer.css';

export default function BuyerAccount() {

  const [companyName, setCompanyName] = useState('Kamau Fabricators');
  const [contactName, setContactName] = useState('Kamau Mwangi');
  const [email, setEmail] = useState('kamau@fabricators.co.ke');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [deliveryAddress, setDeliveryAddress] = useState('Workshop 14, Commercial St, Industrial Area, Nairobi');
  const [regNo, setRegNo] = useState('BN-7821903');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="buyer-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span>BUYER WORKSPACE</span>
          <span className="sep">/</span>
          <span>ACCOUNT SETTINGS</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">BUSINESS PROFILE</h1>
        </div>
        <p className="page-subtitle">Manage company details, delivery locations, and M-Pesa billing credentials.</p>
      </div>

      {saved && (
        <div className="alert-banner" style={{ borderColor: 'var(--primary)' }}>
          <Check size={18} color="var(--primary)" />
          <span>Profile information updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="parsed-card" style={{ maxWidth: '800px' }}>
        <div className="parsed-card-header">
          <span className="parsed-card-title">COMPANY CREDENTIALS</span>
          <span className="badge badge-fulfilled">VERIFIED BUYER</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label>Company / Workshop Name</label>
            <input
              type="text"
              className="input-styled"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Registration Number (BRS / KRA)</label>
            <input
              type="text"
              className="input-styled"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label>Contact Person</label>
            <input
              type="text"
              className="input-styled"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Email Address</label>
            <input
              type="email"
              className="input-styled"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label>M-Pesa Phone (STK Prompts)</label>
            <input
              type="text"
              className="input-styled"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>City &amp; Region</label>
            <input
              type="text"
              className="input-styled"
              value="Nairobi, Kenya (EAT)"
              disabled
              style={{ opacity: 0.7 }}
            />
          </div>
        </div>

        <div className="field-group">
          <label>Default Material Drop-off / Delivery Address</label>
          <input
            type="text"
            className="input-styled"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-primary">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
