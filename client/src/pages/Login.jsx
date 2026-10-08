import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // Route dynamically to appropriate portal based on role
      if (user.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (['DOCTOR', 'NURSE'].includes(user.role)) {
        navigate('/clinical/dashboard');
      } else if (['RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGY_TECHNICIAN', 'HOUSEKEEPING', 'MAINTENANCE'].includes(user.role)) {
        navigate('/operations/dashboard');
      } else if (['BILLING_STAFF', 'INSURANCE_REPRESENTATIVE'].includes(user.role)) {
        navigate('/finance/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            boxShadow: '0 0 24px rgba(2, 132, 199, 0.4)',
            marginBottom: '1rem'
          }}>
            <Activity size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800' }}>Hospital RPA Platform</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Administrative Automation & Digital Healthcare
          </p>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  required
                />
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Instant Role Testing Switcher */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Quick Demo Logins:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: 'Admin', email: 'admin@hospital.com' },
                { label: 'Reception', email: 'reception@hospital.com' },
                { label: 'Doctor', email: 'doctor@hospital.com' },
                { label: 'Billing', email: 'billing@hospital.com' },
                { label: 'Insurance', email: 'insurance@hospital.com' },
                { label: 'Patient', email: 'patient@hospital.com' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => quickSwitch(acc.email)}
                  style={{
                    background: email === acc.email ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${email === acc.email ? '#38bdf8' : 'var(--border-color)'}`,
                    color: email === acc.email ? '#38bdf8' : 'var(--text-secondary)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
