import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Layers } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);
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
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', color: 'var(--primary)', gap: '0.5rem', alignItems: 'center' }}>
          <Layers size={32} />
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>JUMUA</span>
        </div>
        
        <Card title="Welcome back">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {error && <div style={{ color: 'var(--status-error)', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}
            
            <Input 
              label="Email Address" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@company.com"
            />
            
            <Input 
              label="Password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
            
            <Button type="submit" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign up</Link>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>
              Instant Demo Access
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const demoUser = {
                    id: 'd9b3e1a0-1234-4567-89ab-cdef01234567',
                    role: 'MANUFACTURER',
                    company_name: 'Kamau Fabricators',
                    full_name: 'Kamau Mwangi',
                    email: 'kamau@fabricators.co.ke'
                  };
                  localStorage.setItem('token', 'demo-token-buyer');
                  if (window.__setUser) window.__setUser(demoUser);
                  navigate('/buyer/overview');
                  window.location.reload();
                }}
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Buyer View →
              </button>
              <button
                type="button"
                onClick={() => {
                  const demoUser = {
                    id: 'e8c2f3b1-5678-4321-98ba-fedcba987654',
                    role: 'SUPPLIER',
                    company_name: 'Nairobi Steel Supply',
                    full_name: 'Nairobi Steel Supply Ltd',
                    email: 'sales@nairobi-steel.co.ke'
                  };
                  localStorage.setItem('token', 'demo-token-supplier');
                  navigate('/supplier/overview');
                  window.location.reload();
                }}
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Supplier View →
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
