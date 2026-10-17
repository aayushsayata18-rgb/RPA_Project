import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertOctagon, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

export const NotificationReportsPage = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/reports');
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching reports', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const total = reports?.totalDeliveries || 0;
  const delivered = reports?.byStatus?.DELIVERED || 0;
  const failed = reports?.byStatus?.FAILED || 0;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 100;

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Notification Delivery Analytics</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Comprehensive provider SLA, channel volumes, and failure cause diagnostics
          </p>
        </div>
        <button
          onClick={fetchReports}
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Overall Delivery Success Rate</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#10b981', marginTop: '0.4rem' }}>
            {deliveryRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Calculated across all channels</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Total Delivery Attempts</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.4rem' }}>
            {total}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>SMS, Email & In-App combined</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Successful Deliveries</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#34d399', marginTop: '0.4rem' }}>
            {delivered}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Confirmed delivery receipt</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Terminal Delivery Failures</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f87171', marginTop: '0.4rem' }}>
            {failed}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Exhausted retries or invalid destination</span>
        </div>
      </div>

      {/* Grid: Status Distribution & Failure Causes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Channel Volume Stats */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '700' }}>Volume by Channel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(reports?.byChannel || {}).map(([ch, count]) => (
              <div key={ch}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{ch}</span>
                  <span style={{ color: '#94a3b8' }}>{count} attempts</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: ch === 'SMS' ? '#0284c7' : ch === 'EMAIL' ? '#6366f1' : '#10b981',
                      width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Reasons Breakdown */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '700' }}>Failure Diagnostics & Causes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(reports?.failureReasons || []).length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No recent delivery failures logged.</p>
            ) : (
              (reports?.failureReasons || []).map((f) => (
                <div
                  key={f.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <span style={{ fontFamily: 'monospace', color: '#f87171', fontWeight: '600', fontSize: '0.85rem' }}>
                    {f.code}
                  </span>
                  <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {f.count} incidents
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
