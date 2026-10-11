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
        </Card>
      </div>
    </div>
  );
};

export default Login;
