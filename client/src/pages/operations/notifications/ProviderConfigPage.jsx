import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe
} from 'lucide-react';
import api from '../../../services/api';

export const ProviderConfigPage = () => {
  const [testChannel, setTestChannel] = useState('SMS');
  const [testDestination, setTestDestination] = useState('+919876543210');
  const [testMessage, setTestMessage] = useState('Test diagnostic notification from MediSync Gateway.');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTestDispatch = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        type: 'SYSTEM_ALERT',
        channels: [testChannel],
        recipient: {
          phone: testChannel === 'SMS' ? testDestination : null,
          email: testChannel === 'EMAIL' ? testDestination : null,
          name: 'Diagnostic Tester'
        },
        title: 'Diagnostic Test Alert',
        message: testMessage,
        priority: 'NORMAL'
      };

      const res = await api.post('/notifications', payload);
      setTestResult({
        success: true,
        data: res.data?.data
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.response?.data?.message || err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Communication Gateway Configurations</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Provider credentials isolation, gateway health diagnostics, and dispatch simulator
        </p>
      </div>

      {/* Gateway Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* SMS Provider Card */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>Primary SMS Gateway</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              ONLINE (ACTIVE)
            </span>
          </div>

          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700' }}>Mock SMS Gateway Adapter</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Simulates carrier delivery callback, status webhook verification, and simulated timeout reconciliation.
          </p>

          <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Sender ID:</span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>HOSPITAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Timeout:</span>
              <span style={{ color: '#e2e8f0' }}>10,000 ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Credentials Ref:</span>
              <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>secret/sms/provider</span>
            </div>
          </div>
        </div>

        {/* Email Provider Card */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase' }}>Transactional Email Gateway</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              ONLINE (ACTIVE)
            </span>
          </div>

          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700' }}>Transactional SMTP / API Gateway</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Handles password resets, longitudinal discharge dossiers, receipts, and clinical clearance notifications.
          </p>

          <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>From Address:</span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>noreply@hospital-platform.local</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Protocol:</span>
              <span style={{ color: '#e2e8f0' }}>TLS / REST API</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Credentials Ref:</span>
              <span style={{ fontFamily: 'monospace', color: '#6366f1' }}>secret/email/provider</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Gateway Dispatch Simulator */}
      <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={18} color="#38bdf8" /> Live Gateway Dispatch Simulator
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Verify gateway connectivity and inspect raw provider responses in real-time.
        </p>

        <form onSubmit={handleTestDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Channel</label>
              <select
                value={testChannel}
                onChange={(e) => {
                  setTestChannel(e.target.value);
                  setTestDestination(e.target.value === 'SMS' ? '+919876543210' : 'test@hospital.com');
                }}
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
              >
                <option value="SMS">SMS Gateway</option>
                <option value="EMAIL">Email Gateway</option>
                <option value="IN_APP">In-App Engine</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Destination (Phone / Email)</label>
              <input
                type="text"
                value={testDestination}
                onChange={(e) => setTestDestination(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Diagnostic Message Content</label>
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            disabled={testing}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              width: '200px'
            }}
          >
            {testing ? 'Dispatching...' : 'Dispatch Test Alert'}
          </button>
        </form>

        {testResult && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#0f172a', borderRadius: '8px', border: testResult.success ? '1px solid #10b981' : '1px solid #ef4444' }}>
            <div style={{ fontWeight: '700', color: testResult.success ? '#34d399' : '#f87171', marginBottom: '0.5rem' }}>
              {testResult.success ? '✓ Gateway Dispatch Successful' : '✗ Gateway Dispatch Failed'}
            </div>
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', overflowX: 'auto', fontFamily: 'monospace' }}>
              {JSON.stringify(testResult.data || testResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
