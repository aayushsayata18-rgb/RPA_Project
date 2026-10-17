import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  Send,
  RefreshCw,
  FileText,
  Sliders,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';

export const NotificationDashboardPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/dashboard');
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notification metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.post('/notifications/reconcile', { limit: 50 });
      setReconcileResult(res.data?.message || 'Reconciliation completed');
      fetchMetrics();
      setTimeout(() => setReconcileResult(null), 4000);
    } catch (e) {
      console.error('Reconciliation error', e);
    } finally {
      setReconciling(false);
    }
  };

  const today = metrics?.today || {};

  return (
    <div style={{ padding: '2rem', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Notification Service Hub
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Centralized hospital communication engine, delivery reconciliation & template management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={reconciling ? 'spin' : ''} />
            {reconciling ? 'Reconciling...' : 'Run Provider Reconciliation'}
          </button>
          <button
            onClick={() => navigate('/operations/notifications/campaigns')}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
            Broadcast Campaign
          </button>
        </div>
      </div>

      {reconcileResult && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem', color: '#34d399', fontWeight: '600' }}>
          ✓ {reconcileResult}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Today Total</span>
            <Bell size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#f8fafc' }}>
            {today.total || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Cross-module requests</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Delivered</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#10b981' }}>
            {today.delivered || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Confirmed delivered</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Partially Delivered</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#f59e0b' }}>
            {today.partiallyDelivered || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Multi-channel partial</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Failed / Bounced</span>
            <AlertOctagon size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#ef4444' }}>
            {today.failed || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Permanent or limit reached</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Unknown Provider State</span>
            <Clock size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#a855f7' }}>
            {today.unknown || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>Awaiting reconciliation</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Scheduled Ahead</span>
            <Layers size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', color: '#38bdf8' }}>
            {today.scheduled || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Future appointments / reminders</span>
        </div>
      </div>

      {/* Two Column Layout: Channel Volume & Notification Types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Channel Volume */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#38bdf8" />
            Dispatch Distribution by Channel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(metrics?.channelStats || []).map((ch) => (
              <div key={ch.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{ch.channel}</span>
                  <span style={{ color: '#94a3b8' }}>{ch.count} messages</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: ch.channel === 'SMS' ? '#0284c7' : ch.channel === 'EMAIL' ? '#6366f1' : '#10b981',
                      width: `${Math.min(100, Math.max(10, ch.count * 15))}%`
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics?.channelStats || metrics.channelStats.length === 0) && (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No channel data available.</p>
            )}
          </div>
        </div>

        {/* Top Notification Categories */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" />
            Top Notification Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(metrics?.typeStats || []).map((t) => (
              <div
                key={t.type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontWeight: '500', color: '#cbd5e1' }}>{t.type}</span>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div
          onClick={() => navigate('/operations/notifications/list')}
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>Delivery Logs & History →</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Search, filter by recipient, view individual provider responses and retry failed messages.
          </p>
        </div>

        <div
          onClick={() => navigate('/operations/notifications/templates')}
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>Template Management →</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Manage message templates with version preservation, placeholder variables, and approval gates.
          </p>
        </div>

        <div
          onClick={() => navigate('/operations/notifications/campaigns')}
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>Bulk Campaigns →</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Authorized mass messaging with audience preview count and approval workflow.
          </p>
        </div>

        <div
          onClick={() => navigate('/operations/notifications/providers')}
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>Provider Gateways →</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Inspect SMS & Email gateway status, webhook credentials, and test dispatcher.
          </p>
        </div>
      </div>
    </div>
  );
};
