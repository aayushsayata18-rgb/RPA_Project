import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import api from '../../../services/api';

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Action status message
  const [actionMsg, setActionMsg] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (channel) params.channel = channel;
      if (type) params.type = type;

      const res = await api.get('/notifications', { params });
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, status, channel, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleRetry = async (notificationId) => {
    try {
      const res = await api.post(`/notifications/${notificationId}/retry`, { force: true });
      setActionMsg(`Retry completed for ${notificationId}: Status ${res.data?.data?.status}`);
      fetchNotifications();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert(`Retry failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCancel = async (notificationId) => {
    if (!window.confirm(`Are you sure you want to cancel scheduled notification ${notificationId}?`)) return;
    try {
      await api.post(`/notifications/${notificationId}/cancel`, { reason: 'Cancelled by operator' });
      setActionMsg(`Notification ${notificationId} cancelled successfully.`);
      fetchNotifications();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert(`Cancel failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'DELIVERED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <CheckCircle2 size={12} /> DELIVERED
          </span>
        );
      case 'PARTIALLY_DELIVERED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <AlertTriangle size={12} /> PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <AlertOctagon size={12} /> FAILED
          </span>
        );
      case 'UNKNOWN':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <Clock size={12} /> UNKNOWN
          </span>
        );
      case 'SCHEDULED':
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <Clock size={12} /> {st}
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <XCircle size={12} /> CANCELLED
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            {st}
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Notification History & Delivery Logs</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Total {total} tracked hospital communication events
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', borderRadius: '8px', marginBottom: '1rem', color: '#38bdf8', fontSize: '0.9rem' }}>
          {actionMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, minWidth: '240px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by ID, recipient name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 34px',
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <option value="">All Statuses</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="UNKNOWN">Unknown</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <option value="">All Channels</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="IN_APP">In-App Portal</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Notification ID</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Recipient</th>
              <th style={{ padding: '0.85rem 1rem' }}>Channels</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Created / Scheduled</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Loading delivery records...
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No matching notifications found.
                </td>
              </tr>
            ) : (
              notifications.map((n) => (
                <tr key={n.notificationId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '700' }}>
                    {n.notificationId}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{n.type}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.subject || n.title}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '500', color: '#f1f5f9' }}>{n.recipient?.name || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {n.recipient?.phone || n.recipient?.email || n.recipient?.patientId || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(n.channels || [n.channel]).filter(Boolean).map((ch) => (
                        <span key={ch} style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{getStatusBadge(n.status)}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                    {n.scheduledAt ? (
                      <div style={{ color: '#38bdf8' }}>
                        Due: {new Date(n.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <div>{new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => navigate(`/operations/notifications/${n.notificationId}`)}
                        title="View Delivery Attempts"
                        style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                      >
                        <Eye size={14} />
                      </button>
                      {(n.status === 'FAILED' || n.status === 'UNKNOWN' || n.status === 'PARTIALLY_DELIVERED') && (
                        <button
                          onClick={() => handleRetry(n.notificationId)}
                          title="Retry Channel Delivery"
                          style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                        >
                          <RotateCw size={14} />
                        </button>
                      )}
                      {(n.status === 'SCHEDULED' || n.status === 'PENDING') && (
                        <button
                          onClick={() => handleCancel(n.notificationId)}
                          title="Cancel Scheduled Alert"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>Showing {notifications.length} of {total} records</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Prev
            </button>
            <span style={{ padding: '4px 10px', color: '#38bdf8', fontWeight: 'bold' }}>{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={notifications.length < 15}
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
