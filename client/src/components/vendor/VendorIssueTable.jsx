import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, MessageSquare, Plus, FileText } from 'lucide-react';
import vendorService from '../../services/vendorService';

export const VendorIssueTable = ({ vendorId, issues = [], onRefresh, canReport = true, canResolve = true }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Late Delivery',
    severity: 'MEDIUM',
    title: '',
    description: '',
    purchaseOrderId: ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorService.createIssue(vendorId, formData);
      setShowCreateModal(false);
      setFormData({
        category: 'Late Delivery',
        severity: 'MEDIUM',
        title: '',
        description: '',
        purchaseOrderId: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (issueId) => {
    const resolution = prompt('Enter resolution summary:');
    if (!resolution) return;
    const resolutionNotes = prompt('Enter corrective action or concession notes:');
    try {
      await vendorService.resolveIssue(vendorId, issueId, { resolution, resolutionNotes });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const getSeverityBadge = (severity) => {
    const map = {
      LOW: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' },
      MEDIUM: { bg: 'rgba(234, 179, 8, 0.12)', color: '#eab308' },
      HIGH: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
      CRITICAL: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
    };
    const conf = map[severity] || map.MEDIUM;
    return (
      <span
        style={{
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: conf.bg,
          color: conf.color
        }}
      >
        {severity}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Vendor Discrepancies & Issues Log ({issues.length})
        </h4>
        {canReport && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Report Issue
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Issue & Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Severity</th>
              <th style={{ padding: '0.75rem 1rem' }}>PO / Delivery</th>
              <th style={{ padding: '0.75rem 1rem' }}>Vendor Response</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              {canResolve && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={canResolve ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No open or historical issues reported for this vendor.
                </td>
              </tr>
            ) : (
              issues.map((iss) => (
                <tr key={iss.issueId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{iss.title || iss.category}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{iss.description}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      ID: {iss.issueId} • Reported by: {iss.reportedBy}
                    </div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    {getSeverityBadge(iss.severity)}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {iss.purchaseOrderId ? (
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{iss.purchaseOrderId}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', maxWidth: '240px' }}>
                    {iss.vendorResponse?.response ? (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                          "{iss.vendorResponse.response}"
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          By {iss.vendorResponse.respondedBy}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting response</span>
                    )}
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background:
                          iss.status === 'RESOLVED'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : iss.status === 'OPEN'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(234, 179, 8, 0.12)',
                        color:
                          iss.status === 'RESOLVED'
                            ? '#10b981'
                            : iss.status === 'OPEN'
                            ? '#ef4444'
                            : '#eab308'
                      }}
                    >
                      {iss.status}
                    </span>
                  </td>
                  {canResolve && (
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                      {iss.status !== 'RESOLVED' && iss.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleResolve(iss.issueId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          <CheckCircle size={13} /> Resolve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Issue Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
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
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#ef4444' }}>
              Report Vendor Issue / Discrepancy
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Issue Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="Late Delivery">Late Delivery</option>
                    <option value="Wrong Quantity">Wrong Quantity</option>
                    <option value="Damaged Goods">Damaged Goods</option>
                    <option value="Quality Concern">Quality Concern</option>
                    <option value="Documentation Issue">Documentation Issue</option>
                    <option value="Invoice Issue">Invoice Issue</option>
                    <option value="Communication Issue">Communication Issue</option>
                    <option value="Contract Issue">Contract Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Severity Level *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Issue Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 vials broken in shipment #PO-9021"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Associated Purchase Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-00001"
                  value={formData.purchaseOrderId}
                  onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Detailed Description *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain the defect, discrepancy, or delivery failure..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Submitting...' : 'Register Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
