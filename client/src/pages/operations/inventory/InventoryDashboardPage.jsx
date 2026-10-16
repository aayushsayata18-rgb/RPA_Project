import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
  Truck,
  RotateCcw,
  TrendingUp,
  Search,
  ArrowRight,
  ShieldAlert,
  Calendar,
  RefreshCw,
  Plus,
  Clock,
  Warehouse,
  BarChart3,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';
import { useAuth } from '../../../context/AuthContext';

export const InventoryDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({
    totalItems: 0,
    activeBatches: 0,
    locationsCount: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    expiredCount: 0,
    openAlertsCount: 0,
    totalValuation: 0,
    categoryBreakdown: []
  });

  const [recentMovements, setRecentMovements] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [scanMessage, setScanMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpiRes, movesRes, alertsRes] = await Promise.all([
        inventoryService.getDashboardKPIs(),
        inventoryService.getMovements({ limit: 8 }),
        inventoryService.getAlerts({ status: 'OPEN', limit: 5 })
      ]);

      if (kpiRes?.data?.kpis) {
        setKpis(kpiRes.data.kpis);
      }
      if (movesRes?.data?.movements) {
        setRecentMovements(movesRes.data.movements);
      }
      if (alertsRes?.data?.alerts) {
        setActiveAlerts(alertsRes.data.alerts);
      }
    } catch (err) {
      console.error('Error fetching inventory dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleScanExpiry = async () => {
    try {
      setScanMessage({ type: 'info', text: 'Scanning batches for near-expiry...' });
      const res = await inventoryService.scanNearExpiry(30);
      setScanMessage({
        type: 'success',
        text: `Expiry scan complete! Found ${res.data.nearExpiryCount || 0} near-expiry batches.`
      });
      fetchDashboardData();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage({ type: 'error', text: err.response?.data?.message || 'Expiry scan failed.' });
    }
  };

  const handleScanLowStock = async () => {
    try {
      setScanMessage({ type: 'info', text: 'Scanning inventory items against reorder levels...' });
      const res = await inventoryService.scanLowStock();
      setScanMessage({
        type: 'success',
        text: `Low stock scan complete! Found ${res.data.lowStockCount || 0} items at or below reorder level.`
      });
      fetchDashboardData();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage({ type: 'error', text: err.response?.data?.message || 'Low stock scan failed.' });
    }
  };

  if (loading && !refreshing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary-color)' }} />
        <span style={{ marginLeft: '12px', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Loading Medical Inventory Hub...
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Warehouse style={{ color: '#0284c7' }} />
            Medical Inventory Control Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Authoritative physical stock lifecycle, batch tracking, inter-store transfers, and automated reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
            <Clock size={16} /> Scan Expiry (30d)
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
            onClick={() => navigate('/operations/inventory/goods-receipts')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={16} /> New Goods Receipt
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
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

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Total Master Items */}
        <div
          onClick={() => navigate('/operations/inventory/items')}
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Catalog Items</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7' }}>
              <Boxes size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{kpis.totalItems || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span>Across all categories</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Active Batches */}
        <div
          onClick={() => navigate('/operations/inventory/batches')}
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Active Batches</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{kpis.activeBatches || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span>Available for dispensing</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div
          onClick={() => navigate('/operations/inventory/items?stockFilter=LOW_STOCK')}
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Low Stock Items</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#fef3c7', color: '#d97706' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: kpis.lowStockCount > 0 ? '#d97706' : 'var(--text-main)' }}>
            {kpis.lowStockCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span>At or below reorder level</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Near Expiry / Expired */}
        <div
          onClick={() => navigate('/operations/inventory/alerts')}
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Near-Expiry / Expired</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: (kpis.nearExpiryCount || kpis.expiredCount) > 0 ? '#dc2626' : 'var(--text-main)' }}>
            {(kpis.nearExpiryCount || 0) + (kpis.expiredCount || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span>{kpis.expiredCount || 0} expired, {kpis.nearExpiryCount || 0} near</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div
          onClick={() => navigate('/operations/inventory/reports')}
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total Valuation</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)' }}>
            ₹{(kpis.totalValuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9333ea', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span>View valuation breakdown</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* Main Grid: Category Breakdown + Fast Navigation + Actionable Alerts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Quick Hub Navigation */}
        <div
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: '#0284c7' }} />
            Core Inventory Workflows
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/operations/inventory/goods-receipts')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Truck size={20} style={{ color: '#0284c7', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Goods Receipts</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PO receiving & GRN</span>
            </button>

            <button
              onClick={() => navigate('/operations/inventory/transfers')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <RotateCcw size={20} style={{ color: '#059669', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Stock Transfers</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inter-store requests</span>
            </button>

            <button
              onClick={() => navigate('/operations/inventory/adjustments')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <AlertTriangle size={20} style={{ color: '#d97706', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Adjustments</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shrinkage & write-offs</span>
            </button>

            <button
              onClick={() => navigate('/operations/inventory/stock-counts')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <BarChart3 size={20} style={{ color: '#7c3aed', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Cycle Counts</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit & physical sheets</span>
            </button>

            <button
              onClick={() => navigate('/operations/inventory/reconciliations')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <CheckCircle size={20} style={{ color: '#2563eb', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Reconciliation</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discrepancy resolver</span>
            </button>

            <button
              onClick={() => navigate('/operations/inventory/locations')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Warehouse size={20} style={{ color: '#475569', marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Stock Locations</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stores, Wards, OTs</span>
            </button>
          </div>
        </div>

        {/* Category Distribution */}
        <div
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: '#16a34a' }} />
              Stock Category Breakdown
            </h3>
            <button
              onClick={() => navigate('/operations/inventory/items')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
            >
              View Catalog →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(kpis.categoryBreakdown || []).map((cat, idx) => {
              const pct = kpis.totalItems ? Math.round((cat.count / kpis.totalItems) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cat._id || 'OTHER'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {cat.count} items ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background:
                          idx === 0
                            ? '#0284c7'
                            : idx === 1
                            ? '#16a34a'
                            : idx === 2
                            ? '#d97706'
                            : idx === 3
                            ? '#9333ea'
                            : '#64748b',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Split: Recent Movements Ledger + Active Alerts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Recent Ledger Activity */}
        <div
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: '#0284c7' }} />
              Live Stock Movements Ledger
            </h3>
            <button
              onClick={() => navigate('/operations/inventory/reports?tab=ledger')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Full Ledger →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Movement</th>
                  <th style={{ padding: '0.5rem' }}>Item</th>
                  <th style={{ padding: '0.5rem' }}>Type</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent movements logged.
                    </td>
                  </tr>
                ) : (
                  recentMovements.map((m) => (
                    <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{m.movementId}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-main)' }}>
                        <div style={{ fontWeight: '500' }}>{m.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.batchNumber || m.batchId}</div>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                                ? '#dcfce7'
                                : m.movementType === 'ISSUE' || m.movementType === 'TRANSFER_OUT' || m.movementType === 'ADJUSTMENT_OUT'
                                ? '#fee2e2'
                                : '#f1f5f9',
                            color:
                              m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                                ? '#166534'
                                : m.movementType === 'ISSUE' || m.movementType === 'TRANSFER_OUT' || m.movementType === 'ADJUSTMENT_OUT'
                                ? '#991b1b'
                                : '#475569'
                          }}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: m.quantityChange > 0 ? '#16a34a' : m.quantityChange < 0 ? '#dc2626' : 'var(--text-main)'
                        }}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Alerts */}
        <div
          style={{
            background: 'var(--bg-card, #fff)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: '#dc2626' }} />
              Actionable Inventory Alerts
            </h3>
            <button
              onClick={() => navigate('/operations/inventory/alerts')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
            >
              All Alerts →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeAlerts.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <CheckCircle size={24} style={{ color: '#16a34a', marginBottom: '0.5rem' }} />
                <div>All inventory parameters within safe thresholds!</div>
              </div>
            ) : (
              activeAlerts.map((alt) => (
                <div
                  key={alt._id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    backgroundColor: '#fffafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: alt.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b',
                          color: '#fff'
                        }}
                      >
                        {alt.severity}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {alt.alertType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {alt.message}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/operations/inventory/alerts')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
