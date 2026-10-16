import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Package,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const InventoryAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [scanMessage, setScanMessage] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (alertTypeFilter) params.alertType = alertTypeFilter;

      const res = await inventoryService.getAlerts(params);
      if (res?.data) {
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, alertTypeFilter]);

  const handleScanExpiry = async () => {
    try {
      setScanMessage({ type: 'info', text: 'Scanning all inventory batches against 30-day expiry threshold...' });
      const res = await inventoryService.scanNearExpiry(30);
      setScanMessage({
        type: 'success',
        text: `Expiry scan finished! Found ${res.data.nearExpiryCount || 0} batches near expiry.`
      });
      fetchAlerts();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed.' });
    }
  };

  const handleScanLowStock = async () => {
    try {
      setScanMessage({ type: 'info', text: 'Scanning catalog items against reorder levels...' });
      const res = await inventoryService.scanLowStock();
      setScanMessage({
        type: 'success',
        text: `Low stock scan finished! Found ${res.data.lowStockCount || 0} items needing replenishment.`
      });
      fetchAlerts();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed.' });
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await inventoryService.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await inventoryService.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert style={{ color: '#dc2626' }} />
            Medical Inventory Real-Time Alerts
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Near-expiry flags, stock-out and reorder triggers, temperature excursions, and RPA escalation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleScanExpiry}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: '#fff',
              border: '1px solid #f59e0b',
              color: '#d97706',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={16} /> Scan Near Expiry (30d)
          </button>

          <button
            onClick={handleScanLowStock}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: '#fff',
              border: '1px solid #ef4444',
              color: '#dc2626',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <AlertTriangle size={16} /> Scan Low Stock
          </button>

          <button
            onClick={fetchAlerts}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {scanMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: scanMessage.type === 'error' ? '#fef2f2' : scanMessage.type === 'success' ? '#f0fdf4' : '#eff6ff',
            color: scanMessage.type === 'error' ? '#991b1b' : scanMessage.type === 'success' ? '#166534' : '#1e40af',
            border: `1px solid ${scanMessage.type === 'error' ? '#fecaca' : scanMessage.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}
        >
          {scanMessage.type === 'error' ? <AlertCircle size={18} /> : scanMessage.type === 'success' ? <CheckCircle size={18} /> : <Clock size={18} />}
          <span>{scanMessage.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.65rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: '#fff'
            }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open (Action Required)</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Alert Type:</span>
          <select
            value={alertTypeFilter}
            onChange={(e) => setAlertTypeFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.65rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: '#fff'
            }}
          >
            <option value="">All Types</option>
            <option value="NEAR_EXPIRY">Near Expiry</option>
            <option value="EXPIRED">Expired Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="TEMPERATURE_EXCURSION">Temperature Excursion</option>
            <option value="STOCK_DISCREPANCY">Stock Discrepancy</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <CheckCircle size={40} style={{ color: '#16a34a', marginBottom: '0.5rem' }} />
          <h3 style={{ margin: '0.5rem 0', color: 'var(--text-main)' }}>No Active Inventory Alerts</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            All medical items and batches are within prescribed safety limits and shelf-life horizons.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map((alt) => (
            <div
              key={alt._id}
              style={{
                background: '#fff',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: `4px solid ${
                  alt.severity === 'CRITICAL' ? '#dc2626' : alt.severity === 'HIGH' ? '#ea580c' : '#f59e0b'
                }`
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor:
                        alt.severity === 'CRITICAL'
                          ? '#dc2626'
                          : alt.severity === 'HIGH'
                          ? '#ea580c'
                          : '#f59e0b',
                      color: '#fff'
                    }}
                  >
                    {alt.severity}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {alt.alertType}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: alt.status === 'RESOLVED' ? '#dcfce7' : alt.status === 'ACKNOWLEDGED' ? '#eff6ff' : '#fef3c7',
                      color: alt.status === 'RESOLVED' ? '#166534' : alt.status === 'ACKNOWLEDGED' ? '#1d4ed8' : '#d97706'
                    }}
                  >
                    {alt.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {alt.message}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Target: <strong>{alt.targetType}</strong> ({alt.targetId}) • Triggered: {new Date(alt.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {alt.status === 'OPEN' && (
                  <button
                    onClick={() => handleAcknowledge(alt.alertId)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      border: '1px solid var(--border-color)',
                      background: '#fff',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Acknowledge
                  </button>
                )}

                {alt.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(alt.alertId)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
