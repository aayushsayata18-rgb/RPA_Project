import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Building2,
  FileText
} from 'lucide-react';
import vendorService from '../../../services/vendorService';

export const VendorIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolveModal, setResolveModal] = useState({ open: false, issue: null, resolution: '', preventiveAction: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {
        severity: severityFilter || undefined,
        status: statusFilter || undefined
      };
      const res = await vendorService.listAllIssues(params);
      const data = res.data?.data || res.data || [];
      setIssues(data);
    } catch (err) {
      console.error('Failed to fetch cross-vendor issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [severityFilter, statusFilter]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModal.resolution) {
      alert('Resolution details are required');
      return;
    }

    try {
      setActionLoading(true);
      await vendorService.resolveIssue(resolveModal.issue.vendorId?._id || resolveModal.issue.vendorId, resolveModal.issue._id, {
        resolution: resolveModal.resolution,
        preventiveAction: resolveModal.preventiveAction
      });
      setResolveModal({ open: false, issue: null, resolution: '', preventiveAction: '' });
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIssues = issues.filter((i) => {
    const vName = i.vendorId?.legalName || '';
    const vCode = i.vendorId?.vendorCode || '';
    return (
      i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.issueCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const criticalOpenCount = issues.filter((i) => i.severity === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'IN_REVIEW')).length;
  const totalOpen = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_REVIEW').length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Vendor Discrepancies & Grievances Queue
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Dispute management, delivery defects, packaging damage & resolution ledger
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchIssues}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.1rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#334155'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Tickets Logged</span>
            <FileText size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {issues.length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Active Open Issues</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.5rem' }}>
            {totalOpen}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Critical Severity Tickets</span>
            <AlertCircle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#dc2626', marginTop: '0.5rem' }}>
            {criticalOpenCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Resolved Tickets</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search tickets by code, title, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="VENDOR_RESPONDED">VENDOR_RESPONDED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1.25rem' }}>Ticket Code & Title</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Supplier Entity</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Category</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Severity</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Logged Date</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                  Loading grievance tickets...
                </td>
              </tr>
            ) : filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem auto', display: 'block', color: '#16a34a' }} />
                  No open issues or defects found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => {
                const v = issue.vendorId || {};
                const isCritical = issue.severity === 'CRITICAL';
                return (
                  <tr key={issue._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{issue.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{issue.issueCode}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link to={`/operations/vendors/${v._id || v}`} style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'none' }}>
                        {v.legalName || 'Supplier'}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.vendorCode}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: '#475569' }}>
                      {issue.category}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isCritical ? '#fee2e2' : issue.severity === 'HIGH' ? '#ffedd5' : '#f1f5f9',
                          color: isCritical ? '#b91c1c' : issue.severity === 'HIGH' ? '#c2410c' : '#475569'
                        }}
                      >
                        {issue.severity}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: issue.status === 'RESOLVED' ? '#dcfce7' : issue.status === 'OPEN' ? '#fef3c7' : '#f1f5f9',
                          color: issue.status === 'RESOLVED' ? '#15803d' : issue.status === 'OPEN' ? '#92400e' : '#475569'
                        }}
                      >
                        {issue.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {issue.status !== 'RESOLVED' && issue.status !== 'CLOSED' && (
                          <button
                            onClick={() => setResolveModal({ open: true, issue, resolution: '', preventiveAction: '' })}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Resolve
                          </button>
                        )}
                        <Link
                          to={`/operations/vendors/${v._id || v}`}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          Dossier &rarr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Issue Modal */}
      {resolveModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Resolve Issue: {resolveModal.issue?.issueCode}
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              {resolveModal.issue?.title}
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Resolution Summary <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe replacement batch dispatch, credit note issued, or rectification..."
                  value={resolveModal.resolution}
                  onChange={(e) => setResolveModal({ ...resolveModal, resolution: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  CAPA / Preventive Action
                </label>
                <textarea
                  rows={2}
                  placeholder="Cold-chain temperature data logger mandatory for future transit..."
                  value={resolveModal.preventiveAction}
                  onChange={(e) => setResolveModal({ ...resolveModal, preventiveAction: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setResolveModal({ open: false, issue: null, resolution: '', preventiveAction: '' })}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: actionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorIssuesPage;
