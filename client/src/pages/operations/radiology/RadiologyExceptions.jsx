import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

export const RadiologyExceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Resolve Modal
  const [resolvingException, setResolvingException] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listExceptions({
        status: statusFilter,
        severity: severityFilter
      });
      if (res.data?.data) {
        setExceptions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [statusFilter, severityFilter]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingException) return;
    setSubmitting(true);

    try {
      await radiologyService.resolveException(resolvingException._id, {
        resolution: resolutionText
      });

      setResolvingException(null);
      setResolutionText('');
      fetchExceptions();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return { bg: '#fee2e2', text: '#b91c1c' };
      case 'MEDIUM':
        return { bg: '#fef3c7', text: '#b45309' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Radiology Operational Exceptions Queue
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Automated conflict resolution, preparation discrepancies, modality outages and RPA reconciliation
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Exceptions Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 16px' }}>Exception ID</th>
              <th style={{ padding: '14px 16px' }}>Type</th>
              <th style={{ padding: '14px 16px' }}>Severity</th>
              <th style={{ padding: '14px 16px' }}>Patient / Order</th>
              <th style={{ padding: '14px 16px' }}>Description</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading exceptions...</td></tr>
            ) : exceptions.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No operational exceptions found.</td></tr>
            ) : (
              exceptions.map((exp) => {
                const sBadge = getSeverityBadge(exp.severity);
                return (
                  <tr key={exp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>
                      {exp.exceptionId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                      {exp.type}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: sBadge.bg, color: sBadge.text }}>
                        {exp.severity}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {exp.patientName || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '300px' }}>
                      {exp.description}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        background: exp.status === 'RESOLVED' ? '#dcfce7' : '#fee2e2',
                        color: exp.status === 'RESOLVED' ? '#15803d' : '#b91c1c'
                      }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {exp.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => {
                            setResolvingException(exp);
                            setResolutionText('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Resolve Case
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✓ Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Exception Modal */}
      {resolvingException && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Resolve Radiology Operational Exception
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 16px 0' }}>
              Case: <strong>{resolvingException.exceptionId}</strong> • Type: <strong>{resolvingException.type}</strong>
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Resolution Action & Clinical Notes *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe resolution taken (e.g. Patient rescheduled, preparation repeated, duplicate order confirmed cancelled)..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingException(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyExceptions;
