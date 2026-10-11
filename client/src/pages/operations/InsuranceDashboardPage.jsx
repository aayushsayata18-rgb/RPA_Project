import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import insuranceService from '../../services/insuranceService';

export const InsuranceDashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activePolicies: 0,
    pendingVerification: 0,
    verifiedToday: 0,
    manualReviewRequired: 0,
    expiredPolicies: 0,
    failedVerifications: 0,
    totalVerifications: 0,
    successRate: 100
  });

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [targetPolicyId, setTargetPolicyId] = useState('');
  const [verifySource, setVerifySource] = useState('API');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        insuranceService.getDashboardStats().catch(() => ({ stats: {} })),
        insuranceService.listVerifications({
          status: filterStatus || undefined,
          source: filterSource || undefined
        }).catch(() => ({ verifications: [] }))
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (listRes && listRes.verifications) setVerifications(listRes.verifications);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterStatus, filterSource]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickVerify = async (e) => {
    e.preventDefault();
    if (!targetPolicyId.trim()) return;

    try {
      setVerifySubmitting(true);
      setVerifyMessage(null);
      const res = await insuranceService.requestVerification(targetPolicyId.trim(), {
        source: verifySource,
        integrationPreference: verifySource === 'PORTAL' ? 'PORTAL' : 'API'
      });

      setVerifyMessage({
        type: 'success',
        text: `Verification queued successfully! Ref ID: ${res.verificationId}`
      });
      setTimeout(() => {
        setVerifyModalOpen(false);
        setTargetPolicyId('');
        setVerifyMessage(null);
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setVerifyMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to trigger verification'
      });
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleRetry = async (verificationId) => {
    try {
      await insuranceService.retryVerification(verificationId);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Retry failed');
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (v.verificationId && v.verificationId.toLowerCase().includes(term)) ||
      (v.policyNumber && v.policyNumber.toLowerCase().includes(term)) ||
      (v.patientId && v.patientId.toLowerCase().includes(term)) ||
      (v.patientName && v.patientName.toLowerCase().includes(term)) ||
      (v.insurerName && v.insurerName.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={12} /> VERIFIED
          </span>
        );
      case 'PARTIALLY_VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <Clock size={12} /> PARTIAL
          </span>
        );
      case 'QUEUED':
      case 'REQUESTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <RefreshCw size={12} className="spin-icon" /> QUEUED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <RefreshCw size={12} className="spin-icon" /> RUNNING
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> EXPIRED
          </span>
        );
      case 'NOT_ELIGIBLE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle size={12} /> NOT ELIGIBLE
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
            <AlertCircle size={12} /> NOT FOUND
          </span>
        );
      case 'AMBIGUOUS':
      case 'MANUAL_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <AlertTriangle size={12} /> MANUAL REVIEW
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> FAILED
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  const getNetworkBadge = (network) => {
    if (network === 'IN_NETWORK') {
      return (
        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          IN-NETWORK
        </span>
      );
    }
    if (network === 'OUT_OF_NETWORK') {
      return (
        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          OUT-OF-NETWORK
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}>
        UNKNOWN
      </span>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} color="#0284c7" />
            Insurance Policy Verification Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Automated eligibility, network validation, coverage retrieval & exception routing engine
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            className="btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setVerifyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <PlusCircle size={16} />
            Verify Policy
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Policies</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.4rem' }}>{stats.activePolicies}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Currently valid in master</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Queue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.4rem' }}>{stats.pendingVerification}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Awaiting API / RPA</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Verified Today</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', marginTop: '0.4rem' }}>{stats.verifiedToday}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Confirmed eligible</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Manual Review</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.4rem' }}>{stats.manualReviewRequired}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ambiguous / Exceptions</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Expired Policies</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ef4444', marginTop: '0.4rem' }}>{stats.expiredPolicies}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Requires renewal update</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Success Rate</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.4rem' }}>{stats.successRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Automated throughput</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Verification ID, Policy #, Patient Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PARTIALLY_VERIFIED">Partially Verified</option>
            <option value="QUEUED">Queued / Requested</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AMBIGUOUS">Ambiguous / Review</option>
            <option value="EXPIRED">Expired</option>
            <option value="NOT_ELIGIBLE">Not Eligible</option>
            <option value="NOT_FOUND">Not Found</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Sources</option>
            <option value="API">Official API</option>
            <option value="INSURER_PORTAL">Portal Automation (RPA)</option>
            <option value="MANUAL">Manual Verification</option>
          </select>
        </div>
      </div>

      {/* Main Verifications Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Verification ID</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Insurer & Policy</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Network</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Coverage & Auth</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.75rem' }} />
                    Loading verification records...
                  </td>
                </tr>
              ) : filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileText size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    No verification records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((row) => (
                  <tr
                    key={row._id || row.verificationId}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                      {row.verificationId}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.patientName || 'Unknown Patient'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {row.patientId}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.insurerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Pol: <span style={{ fontFamily: 'monospace' }}>{row.policyNumber}</span>
                        {row.memberId ? ` • Mem: ${row.memberId}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {row.verificationSource || 'API'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getNetworkBadge(row.networkStatus)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {row.coverageLimit !== null && row.coverageLimit !== undefined ? (
                        <div style={{ fontWeight: 600, color: '#10b981' }}>
                          ₹{Number(row.coverageLimit).toLocaleString()}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Limit: Not Avail</div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: row.authorizationRequired === 'REQUIRED' ? '#fbbf24' : 'var(--text-muted)' }}>
                        Auth: {row.authorizationRequired || 'Unknown'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {row.completedAt ? new Date(row.completedAt).toLocaleString() : row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '-'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/finance/verifications/${row.verificationId}`)}
                          style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Eye size={12} /> View
                        </button>

                        {(row.status === 'FAILED' || row.status === 'TIMEOUT') && (
                          <button
                            onClick={() => handleRetry(row.verificationId)}
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#fbbf24',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <RefreshCw size={12} /> Retry
                          </button>
                        )}

                        {(row.status === 'AMBIGUOUS' || row.status === 'MANUAL_REVIEW') && (
                          <button
                            onClick={() => navigate(`/finance/verifications/${row.verificationId}`)}
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(245, 158, 11, 0.2)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              color: '#fbbf24',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <UserCheck size={12} /> Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Verify Modal */}
      {verifyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#0284c7" /> Trigger Policy Verification
              </h3>
              <button
                onClick={() => setVerifyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleQuickVerify}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Policy ID or Policy Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. POL-ABC-45892 or INS-POL-00045"
                  value={targetPolicyId}
                  onChange={(e) => setTargetPolicyId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Preferred Verification Method *
                </label>
                <select
                  value={verifySource}
                  onChange={(e) => setVerifySource(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="API">Official Insurer REST API (Fastest)</option>
                  <option value="PORTAL">Insurer Web Portal Automation (Robot Framework RPA)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Per system rules, API is prioritized; fallback automatically engages portal automation when unavailable.
                </div>
              </div>

              {verifyMessage && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    background: verifyMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: verifyMessage.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${verifyMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}
                >
                  {verifyMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {verifySubmitting ? 'Queueing...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDashboardPage;
