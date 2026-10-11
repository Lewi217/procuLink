import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Layers } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'BUYER',
    company_name: '',
    company_registration_number: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await register(formData);
      if (user.role === 'SUPPLIER') {
        navigate('/supplier/overview');
      } else {
        navigate('/buyer/overview');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', color: 'var(--primary)', gap: '0.5rem', alignItems: 'center' }}>
          <Layers size={32} />
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>JUMUA</span>
        </div>
        
        <Card title="Create an account">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {error && <div style={{ color: 'var(--status-error)', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: `1px solid ${formData.role === 'BUYER' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', backgroundColor: formData.role === 'BUYER' ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-surface)' }}>
                <input type="radio" name="role" value="BUYER" checked={formData.role === 'BUYER'} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Buyer</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: `1px solid ${formData.role === 'SUPPLIER' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', backgroundColor: formData.role === 'SUPPLIER' ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-surface)' }}>
                <input type="radio" name="role" value="SUPPLIER" checked={formData.role === 'SUPPLIER'} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Supplier</span>
              </label>
            </div>

            <Input label="Company Name" name="company_name" required value={formData.company_name} onChange={handleChange} />
            <Input label="Email Address" type="email" name="email" required value={formData.email} onChange={handleChange} />
            <Input label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
            <Input label="Company Reg Number" name="company_registration_number" value={formData.company_registration_number} onChange={handleChange} />
            <Input label="Password" type="password" name="password" required value={formData.password} onChange={handleChange} />
            
            <Button type="submit" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
