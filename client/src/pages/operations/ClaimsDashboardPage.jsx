import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Send,
  Eye,
  Filter
} from 'lucide-react';
import insuranceClaimService from '../../services/insuranceClaimService';

export const ClaimsDashboardPage = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [claimTypeFilter, setClaimTypeFilter] = useState('');
  const [error, setError] = useState(null);

  const fetchClaimsAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimsRes, statsRes] = await Promise.all([
        insuranceClaimService.getClaims({
          status: statusFilter || undefined,
          claimType: claimTypeFilter || undefined,
          search: searchTerm || undefined,
          limit: 100
        }),
        insuranceClaimService.getDashboardStats()
      ]);

      if (claimsRes && claimsRes.data) {
        setClaims(claimsRes.data);
      }
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load insurance claims:', err);
      setError('Unable to load claims data. Please check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaimsAndStats();
  }, [statusFilter, claimTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaimsAndStats();
  };

  const handleManualCheckStatus = async (claimId, e) => {
    e.stopPropagation();
    try {
      setRefreshing(true);
      await insuranceClaimService.checkClaimStatus(claimId);
      fetchClaimsAndStats();
    } catch (err) {
      alert(`Status check failed: ${err.response?.data?.message || err.message}`);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', label: 'Draft' },
      READY: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'Ready' },
      SUBMITTED: { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', label: 'Submitted' },
      UNDER_REVIEW: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', label: 'Under Review' },
      QUERY: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', label: 'Query Raised' },
      MORE_INFORMATION_REQUIRED: { bg: 'rgba(249, 115, 22, 0.2)', text: '#ea580c', label: 'Docs Required' },
      APPROVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Approved' },
      PARTIALLY_APPROVED: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Partially Approved' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Rejected' },
      PAID: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: 'Paid & Settled' },
      CANCELLED: { bg: 'rgba(100, 116, 139, 0.2)', text: '#64748b', label: 'Cancelled' }
    };
    const s = map[status] || { bg: '#e2e8f0', text: '#475569', label: status };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: s.bg,
          color: s.text
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: s.text
          }}
        />
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Insurance Claims Management
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Administrative processing, package validation, insurer submission, status polling & billing settlement
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchClaimsAndStats();
            }}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/finance/claims/create')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={18} />
            <span>Create New Claim</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div
            onClick={() => setStatusFilter('')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: !statusFilter ? '2px solid #0284c7' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Total Claims</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {stats.totalClaims || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.25rem' }}>
              ₹{(stats.totalClaimedAmount || 0).toLocaleString()}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('READY')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: statusFilter === 'READY' ? '2px solid #38bdf8' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Ready for Submission</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.25rem' }}>
              {stats.ready || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Drafts: {stats.draft || 0}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('SUBMITTED')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: statusFilter === 'SUBMITTED' ? '2px solid #818cf8' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Submitted / Review</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#818cf8', marginTop: '0.25rem' }}>
              {(stats.submitted || 0) + (stats.underReview || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Review: {stats.underReview || 0}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('QUERY')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: statusFilter === 'QUERY' ? '2px solid #f97316' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Queries & Missing Docs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f97316', marginTop: '0.25rem' }}>
              {(stats.query || 0) + (stats.moreInfoRequired || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f97316', marginTop: '0.25rem' }}>
              Action required
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('APPROVED')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: statusFilter === 'APPROVED' ? '2px solid #22c55e' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Approved / Partial</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e', marginTop: '0.25rem' }}>
              {(stats.approved || 0) + (stats.partiallyApproved || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem' }}>
              ₹{(stats.totalApprovedAmount || 0).toLocaleString()}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('PAID')}
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: statusFilter === 'PAID' ? '2px solid #10b981' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>Paid & Reconciled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
              {stats.paid || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
              ₹{(stats.totalSettledAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by Claim ID, Patient Name, Policy #, or Insurer Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-sidebar)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
            Filter
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-sidebar)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="QUERY">Query</option>
            <option value="MORE_INFORMATION_REQUIRED">More Info Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_APPROVED">Partially Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid / Settled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={claimTypeFilter}
            onChange={(e) => setClaimTypeFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-sidebar)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Claim Types</option>
            <option value="INPATIENT">Inpatient (IPD)</option>
            <option value="OUTPATIENT">Outpatient (OPD)</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="DAYCARE">Daycare</option>
            <option value="SURGICAL">Surgical</option>
            <option value="PHARMACY">Pharmacy</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem', color: '#0284c7' }} />
            <div>Loading claims records...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
            <div>{error}</div>
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No insurance claims found</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
              {statusFilter || searchTerm ? 'Try resetting filters or searching with another term.' : 'Get started by creating a new claim dossier.'}
            </p>
            <button
              onClick={() => navigate('/finance/claims/create')}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)' }}
            >
              Create First Claim
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Claim ID</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Patient</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Insurer & Policy</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Claim Amount</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Approved</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Submitted / Checked</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.claimId}
                    onClick={() => navigate(`/finance/claims/${claim.claimId}`)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                      {claim.claimId}
                      {claim.insurerReferenceNumber && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          Ref: {claim.insurerReferenceNumber}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{claim.patientName || claim.patientId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {claim.patientId}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{claim.insurerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pol: {claim.policyNumber}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '0.78rem', background: 'var(--bg-sidebar)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {claim.claimType}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      ₹{(claim.totalClaimAmount || claim.claimAmount || 0).toLocaleString()}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: claim.approvedAmount > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                      {claim.approvedAmount > 0 ? `₹${claim.approvedAmount.toLocaleString()}` : '—'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(claim.status)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {claim.submittedAt ? (
                        <div>
                          <div>{new Date(claim.submittedAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(claim.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not submitted</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {['SUBMITTED', 'UNDER_REVIEW', 'QUERY', 'MORE_INFORMATION_REQUIRED'].includes(claim.status) && (
                          <button
                            title="Poll Status from Insurer"
                            onClick={(e) => handleManualCheckStatus(claim.claimId, e)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-color)',
                              padding: '0.35rem 0.6rem',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            <RefreshCw size={13} />
                            <span>Check</span>
                          </button>
                        )}

                        <button
                          title="Open Dossier"
                          onClick={() => navigate(`/finance/claims/${claim.claimId}`)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            color: '#38bdf8',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimsDashboardPage;
