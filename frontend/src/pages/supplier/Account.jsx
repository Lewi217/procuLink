import React, { useState } from 'react';
import { Check, Save } from 'lucide-react';
import '../buyer/Buyer.css';

export default function SupplierAccount() {

  const [companyName, setCompanyName] = useState('Nairobi Steel Supply');
  const [contactName, setContactName] = useState('Joseph Mwangi');
  const [email, setEmail] = useState('sales@nairobi-steel.co.ke');
  const [phone, setPhone] = useState('+254 722 000 111');
  const [warehouseAddress, setWarehouseAddress] = useState('Yard 7, Enterprise Road, Industrial Area, Nairobi');
  const [bankPaybill, setBankPaybill] = useState('KCB Bank · A/C 1189201948');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="supplier-page">
      <div className="page-header">
        <div className="breadcrumb">
          <span>SUPPLIER WORKSPACE</span>
          <span className="sep">/</span>
          <span>ACCOUNT SETTINGS</span>
        </div>
        <div className="page-title-row">
          <h1 className="page-title">SUPPLIER PROFILE</h1>
        </div>
        <p className="page-subtitle">Configure warehouse distribution points, settlement bank accounts, and merchant contacts.</p>
      </div>

      {saved && (
        <div className="alert-banner" style={{ borderColor: 'var(--primary)' }}>
          <Check size={18} color="var(--primary)" />
          <span>Supplier credentials updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="parsed-card" style={{ maxWidth: '800px' }}>
        <div className="parsed-card-header">
          <span className="parsed-card-title">MERCHANT PROFILE</span>
          <span className="badge badge-fulfilled">VERIFIED SUPPLIER</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label>Supplier / Company Name</label>
            <input
              type="text"
              className="input-styled"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Primary Phone</label>
            <input
              type="text"
              className="input-styled"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label>Sales Officer / Contact</label>
            <input
              type="text"
              className="input-styled"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Official Email</label>
            <input
              type="email"
              className="input-styled"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="field-group">
          <label>Main Warehouse &amp; Stockyard Address</label>
          <input
            type="text"
            className="input-styled"
            value={warehouseAddress}
            onChange={(e) => setWarehouseAddress(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Settlement Account / Escrow Payout Channel</label>
          <input
            type="text"
            className="input-styled"
            value={bankPaybill}
            onChange={(e) => setBankPaybill(e.target.value)}
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
