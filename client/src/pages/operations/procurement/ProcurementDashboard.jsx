import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  FileCheck,
  FileText,
  Truck,
  AlertTriangle,
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const ProcurementDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, analyticsRes] = await Promise.all([
        ProcurementService.getDashboardKPIs(),
        ProcurementService.getSpendAnalytics()
      ]);
      setStats(statsRes.stats);
      setAnalytics(analyticsRes.analytics);
    } catch (err) {
      console.error('Failed to load procurement dashboard:', err);
      setError(err.message || 'Failed to load procurement dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: 'var(--radius-md)', color: '#38bdf8' }}>
              <ShoppingCart size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Hospital Procurement Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Module 19 — Purchase requests, vendor quotation comparisons, purchase orders, goods receipts, and 3-way matching.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchDashboardData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/operations/procurement/requests/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              background: '#0284c7',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
            }}
          >
            <PlusCircle size={16} />
            New Purchase Request
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Open Requests */}
        <Link to="/operations/procurement/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Requests</span>
              <div style={{ padding: '0.4rem', background: 'rgba(56, 189, 248, 0.12)', borderRadius: 'var(--radius-sm)', color: '#38bdf8' }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.openRequests ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View requests queue</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Pending Approvals */}
        <Link to="/operations/procurement/approvals" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Approvals</span>
              <div style={{ padding: '0.4rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: 'var(--radius-sm)', color: '#f59e0b' }}>
                <FileCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>
              {loading ? '...' : stats?.pendingApprovalRequests ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Authorize requests</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Active RFQs */}
        <Link to="/operations/procurement/rfqs" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Open RFQs</span>
              <div style={{ padding: '0.4rem', background: 'rgba(168, 85, 247, 0.12)', borderRadius: 'var(--radius-sm)', color: '#c084fc' }}>
                <Layers size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.openRfqs ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Vendor inquiries</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Open POs */}
        <Link to="/operations/procurement/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Purchase Orders</span>
              <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-sm)', color: '#10b981' }}>
                <ShoppingCart size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
              {loading ? '...' : stats?.openPOs ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Track active orders</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Delayed Deliveries */}
        <Link to="/operations/procurement/deliveries" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Delayed Shipments</span>
              <div style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.12)', borderRadius: 'var(--radius-sm)', color: '#ef4444' }}>
                <Truck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats?.delayedDeliveries > 0 ? '#ef4444' : 'var(--text-primary)' }}>
              {loading ? '...' : stats?.delayedDeliveries ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Logistics status</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Invoice Mismatches */}
        <Link to="/operations/procurement/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Invoice Mismatches</span>
              <div style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.12)', borderRadius: 'var(--radius-sm)', color: '#f87171' }}>
                <Receipt size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats?.invoiceMismatches > 0 ? '#f87171' : 'var(--text-primary)' }}>
              {loading ? '...' : stats?.invoiceMismatches ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Three-way match queue</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Total Spend */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Purchase Spend</span>
            <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-sm)', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>
            ₹{loading ? '...' : (stats?.totalSpend || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Across {stats?.poCount || 0} active purchase orders
          </span>
        </div>
      </div>

      {/* Procurement Workflow Stepper Guide */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="#38bdf8" />
          Procurement Lifecycle Stage Navigator
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <Link to="/operations/procurement/requests" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Step 1</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Purchase Requests</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Department requirements</div>
            </div>
          </Link>

          <Link to="/operations/procurement/approvals" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Step 2</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Approval Queue</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Managerial authorization</div>
            </div>
          </Link>

          <Link to="/operations/procurement/rfqs" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>Step 3</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>RFQs & Quotations</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Multi-vendor quotes</div>
            </div>
          </Link>

          <Link to="/operations/procurement/comparisons" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.06)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Step 4</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Vendor Selection</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Comparison matrix</div>
            </div>
          </Link>

          <Link to="/operations/procurement/orders" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Step 5</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Purchase Orders</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>PO & vendor dispatch</div>
            </div>
          </Link>

          <Link to="/operations/procurement/deliveries" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Step 6</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>Delivery Tracking</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Transit & GRN receipt</div>
            </div>
          </Link>

          <Link to="/operations/procurement/invoices" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase' }}>Step 7</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>3-Way Matching</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Finance handoff</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Spend Analytics & Vendor Performance Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Department Spend */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Expenditure by Department</span>
            <Link to="/operations/procurement/reports" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>Full Report</Link>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics?.departmentSpend?.slice(0, 5).map((dept) => (
              <div key={dept._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{dept._id}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#38bdf8' }}>₹{dept.totalEstimated?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{dept.requestCount} requests</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Allocation */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Top Contracted Vendors</span>
            <Link to="/operations/procurement/reports" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>Scorecards</Link>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics?.vendorSpend?.slice(0, 5).map((v) => (
              <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>{v._id}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.vendorId}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>₹{v.totalPOValue?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{v.poCount} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
