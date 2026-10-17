import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Layers,
  Send,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../../../services/api';

export const NotificationDetailPage = () => {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/${notificationId}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [notificationId]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await api.post(`/notifications/${notificationId}/retry`, { force: true });
      setActionMsg(`Retry completed: Status is now ${res.data?.data?.status}`);
      fetchDetails();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert(`Retry failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this scheduled notification?')) return;
    try {
      await api.post(`/notifications/${notificationId}/cancel`, { reason: 'Cancelled by operator' });
      setActionMsg('Notification cancelled successfully.');
      fetchDetails();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert(`Cancel failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading notification details...</div>;
  }

  if (!data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
        <h3>Notification not found</h3>
        <button onClick={() => navigate('/operations/notifications/list')} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem' }}>
          Back to list
        </button>
      </div>
    );
  }

  const deliveries = data.deliveries || [];

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/operations/notifications/list')}
          style={{ background: 'none', border: 'none', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
        >
          <ArrowLeft size={16} /> Back to History
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(data.status === 'FAILED' || data.status === 'UNKNOWN' || data.status === 'PARTIALLY_DELIVERED') && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <RotateCw size={16} className={retrying ? 'spin' : ''} />
              {retrying ? 'Retrying...' : 'Retry Delivery'}
            </button>
          )}

          {(data.status === 'SCHEDULED' || data.status === 'PENDING') && (
            <button
              onClick={handleCancel}
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <XCircle size={16} /> Cancel Scheduled Alert
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem', color: '#34d399', fontWeight: '600' }}>
          ✓ {actionMsg}
        </div>
      )}

      {/* Main Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Notification Metadata */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</span>
            <span style={{ background: data.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: data.status === 'DELIVERED' ? '#34d399' : '#f87171', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700' }}>
              {data.status}
            </span>
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 1rem', fontFamily: 'monospace', color: '#38bdf8' }}>
            {data.notificationId}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Event Type:</span>
              <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{data.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Priority:</span>
              <span style={{ fontWeight: '700', color: data.priority === 'CRITICAL' ? '#f87171' : '#38bdf8' }}>{data.priority}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Channels:</span>
              <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{(data.channels || [data.channel]).filter(Boolean).join(', ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Template Code:</span>
              <span style={{ fontFamily: 'monospace', color: '#a855f7' }}>{data.templateCode || 'DIRECT_MESSAGE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Template Version:</span>
              <span style={{ color: '#e2e8f0' }}>v{data.templateVersion || 1}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Idempotency Key:</span>
              <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>{data.idempotencyKey || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Created At:</span>
              <span style={{ color: '#cbd5e1' }}>{new Date(data.createdAt).toLocaleString()}</span>
            </div>
            {data.deliveredAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Delivered At:</span>
                <span style={{ color: '#34d399' }}>{new Date(data.deliveredAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recipient Information */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#38bdf8' }}>
            <User size={18} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Recipient Details</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Name</span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
                {data.recipient?.name || 'Authorized Recipient'}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Destination Phone</span>
              <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
                {data.recipient?.phone || data.recipientPhone || 'Not provided'}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Destination Email</span>
              <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
                {data.recipient?.email || data.recipientEmail || 'Not provided'}
              </span>
            </div>
            {data.recipient?.patientId && (
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Patient ID</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{data.recipient.patientId}</span>
              </div>
            )}
            {data.reference?.entityType && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Business Reference</span>
                <span style={{ fontWeight: '600', color: '#cbd5e1' }}>
                  {data.reference.entityType} #{data.reference.entityId || data.entityId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Content Preview */}
      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#38bdf8" /> Message Payload
        </h3>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Subject / Header</span>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#f1f5f9' }}>{data.subject || data.title}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Rendered Body Content</span>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
            {data.body || data.message}
          </div>
        </div>
      </div>

      {/* Per-Channel Delivery Attempts Table (Section 12) */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
            Delivery Attempts & Provider Responses ({deliveries.length})
          </h3>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
            Audit log of per-channel provider acceptance, timestamps, and error codes
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Delivery ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Channel</th>
              <th style={{ padding: '0.75rem 1rem' }}>Provider Gateway</th>
              <th style={{ padding: '0.75rem 1rem' }}>Attempt #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Provider Msg ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Result / Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No delivery records generated yet.
                </td>
              </tr>
            ) : (
              deliveries.map((dlv) => (
                <tr key={dlv.deliveryId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '600' }}>
                    {dlv.deliveryId}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{dlv.channel}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{dlv.provider}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{dlv.attemptNumber}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {dlv.providerMessageId || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: dlv.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : dlv.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: dlv.status === 'DELIVERED' ? '#34d399' : dlv.status === 'FAILED' ? '#f87171' : '#38bdf8'
                    }}>
                      {dlv.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                    {dlv.errorMessage ? (
                      <span style={{ color: '#f87171' }}>Error: {dlv.errorMessage}</span>
                    ) : dlv.deliveredAt ? (
                      <span style={{ color: '#34d399' }}>Delivered {new Date(dlv.deliveredAt).toLocaleTimeString()}</span>
                    ) : (
                      <span>Requested {new Date(dlv.requestedAt).toLocaleTimeString()}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
