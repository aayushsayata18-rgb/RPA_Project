import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  ShieldAlert,
  FileText,
  Award,
  Plus,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import vendorService from '../../../services/vendorService';

export const VendorDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingDocs, setCheckingDocs] = useState(false);
  const [checkingContracts, setCheckingContracts] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getDashboardKPIs();
      setKpis(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to load vendor dashboard KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const handleCheckDocs = async () => {
    try {
      setCheckingDocs(true);
      const res = await vendorService.checkExpiry(30);
      const data = res.data?.data || res.data;
      setAlertMessage(`Expiry Monitor: Found ${data.expiringSoonCount || 0} document(s) expiring within 30 days and ${data.expiredCount || 0} expired document(s).`);
      fetchKPIs();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setCheckingDocs(false);
    }
  };

  const handleCheckContracts = async () => {
    try {
      setCheckingContracts(true);
      const res = await vendorService.checkExpiringContracts();
      const data = res.data?.data || res.data;
      setAlertMessage(`Contract Monitor: Found ${data.expiringContractsCount || 0} contract(s) due for renewal review within notification window.`);
      fetchKPIs();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setCheckingContracts(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Vendor Management Dashboard...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Building2 size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Vendor Management Master Hub
            </h2>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Authoritative source of truth for hospital vendor masters, compliance certificates, contracts, and performance tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckDocs}
            disabled={checkingDocs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={checkingDocs ? 'spin' : ''} />
            {checkingDocs ? 'Checking...' : 'Check Doc Expiry'}
          </button>

          <button
            onClick={handleCheckContracts}
            disabled={checkingContracts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Award size={14} />
            {checkingContracts ? 'Checking...' : 'Scan Contracts'}
          </button>

          <Link
            to="/operations/vendors/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(56, 189, 248, 0.2)'
            }}
          >
            <Plus size={16} /> Onboard New Vendor
          </Link>
        </div>
      </div>

      {/* Alert Banner if triggered */}
      {alertMessage && (
        <div
          style={{
            padding: '0.85rem 1.2rem',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: '0.88rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{alertMessage}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* Total Vendors */}
        <Link
          to="/operations/vendors/list"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Vendors
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
            {kpis?.activeVendors || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            of {kpis?.totalVendors || 0} total registered
          </div>
        </Link>

        {/* Pending Verification */}
        <Link
          to="/operations/vendors/list?status=PENDING_VERIFICATION"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Verification
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8' }}>
            {kpis?.pendingVerification || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Statutory & identity checks
          </div>
        </Link>

        {/* Pending Approval */}
        <Link
          to="/operations/vendors/list?status=PENDING_APPROVAL"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Approval
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#eab308' }}>
            {kpis?.pendingApproval || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Awaiting executive sign-off
          </div>
        </Link>

        {/* Expiring Documents */}
        <Link
          to="/operations/vendors/documents"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Expiring Documents
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f97316' }}>
            {kpis?.expiringDocumentsCount || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Due within 30 days
          </div>
        </Link>

        {/* Expiring Contracts */}
        <Link
          to="/operations/vendors/contracts"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Expiring Contracts
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a855f7' }}>
            {kpis?.expiringContractsCount || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Framework & rate renewal
          </div>
        </Link>

        {/* Suspended Vendors */}
        <Link
          to="/operations/vendors/list?status=SUSPENDED"
          style={{
            textDecoration: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Suspended Vendors
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>
            {kpis?.suspendedVendors || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Procurement blocked
          </div>
        </Link>
      </div>

      {/* Visual Analytics / Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Category Distribution */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Vendors by Product Category
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital Supply Master</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {(kpis?.categoryDistribution || []).map((cat) => {
              const maxCount = Math.max(...(kpis?.categoryDistribution || []).map((c) => c.count), 1);
              const pct = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={cat._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat._id}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{cat.count} vendor(s)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Type Distribution */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Vendors by Entity Type
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classification Ledger</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {(kpis?.typeDistribution || []).map((t) => {
              const maxCount = Math.max(...(kpis?.typeDistribution || []).map((c) => c.count), 1);
              const pct = Math.round((t.count / maxCount) * 100);
              return (
                <div key={t._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t._id}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.count} vendor(s)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Link
          to="/operations/vendors/list"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={20} style={{ color: '#38bdf8' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Vendor Directory</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Search and filter vendor masters</div>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link
          to="/operations/vendors/contracts"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={20} style={{ color: '#a855f7' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Contracts Ledger</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Frameworks, SLAs & renewals</div>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link
          to="/operations/vendors/issues"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Vendor Issues & Claims</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Defects, delays & corrective actions</div>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>
    </div>
  );
};
