import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Search, Eye, Edit3, FileText, CheckCircle, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';

export const RadiologyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Viewer Modal
  const [viewingReport, setViewingReport] = useState(null);

  // Amendment Modal
  const [amendingReport, setAmendingReport] = useState(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendedFindings, setAmendedFindings] = useState('');
  const [amendedImpression, setAmendedImpression] = useState('');
  const [submittingAmendment, setSubmittingAmendment] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listReports({
        search,
        status: statusFilter
      });
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const openViewModal = async (report) => {
    try {
      const res = await radiologyService.getReportById(report._id);
      setViewingReport(res.data?.data || report);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openAmendModal = (report) => {
    setAmendingReport(report);
    setAmendmentReason('');
    setAmendedFindings(report.findings || '');
    setAmendedImpression(report.impression || '');
    setError('');
  };

  const handleConfirmAmendment = async (e) => {
    e.preventDefault();
    if (!amendmentReason) {
      setError('Amendment reason is strictly mandatory.');
      return;
    }
    setSubmittingAmendment(true);

    try {
      await radiologyService.amendReport(amendingReport._id, {
        amendmentReason,
        findings: amendedFindings,
        impression: amendedImpression
      });

      alert(`Report amended successfully. A new auditable version has been released.`);
      setAmendingReport(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmittingAmendment(false);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Diagnostic Radiology Reports Archive
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Authorized verified clinical reports, multi-version amendment history, and secure report distribution
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Report Number, Patient Name, Impression..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <button type="submit" style={{ padding: '9px 18px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Statuses</option>
          <option value="RELEASED">Released</option>
          <option value="FINALIZED">Finalized</option>
          <option value="AMENDED">Amended (Previous Versions)</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 16px' }}>Report Number</th>
              <th style={{ padding: '14px 16px' }}>Version</th>
              <th style={{ padding: '14px 16px' }}>Patient Name</th>
              <th style={{ padding: '14px 16px' }}>Reporting Radiologist</th>
              <th style={{ padding: '14px 16px' }}>Released Date</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading diagnostic reports...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No diagnostic reports found.</td></tr>
            ) : (
              reports.map((rpt) => (
                <tr key={rpt._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>
                    {rpt.reportNumber}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                      v{rpt.reportVersion || 1}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                    {rpt.patientName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {rpt.radiologistName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {rpt.releasedAt ? new Date(rpt.releasedAt).toLocaleDateString() : 'Unreleased'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      background: rpt.status === 'RELEASED' ? '#dcfce7' : rpt.status === 'AMENDED' ? '#fef3c7' : '#eff6ff',
                      color: rpt.status === 'RELEASED' ? '#15803d' : rpt.status === 'AMENDED' ? '#b45309' : '#1d4ed8'
                    }}>
                      {rpt.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => openViewModal(rpt)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} /> View
                      </button>

                      {rpt.status === 'RELEASED' && (
                        <button
                          onClick={() => openAmendModal(rpt)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fde68a',
                            background: '#fef3c7',
                            color: '#b45309',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={14} /> Amend
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

      {/* View Signed Report Modal */}
      {viewingReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '720px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Official Diagnostic Radiology Report</h3>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Report #: {viewingReport.reportNumber} (Version {viewingReport.reportVersion})</div>
              </div>
              <button onClick={() => setViewingReport(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto', fontSize: '13px', lineHeight: '1.6', color: '#1e293b' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div><strong>Patient Name:</strong> {viewingReport.patientName}</div>
                <div><strong>Date Released:</strong> {viewingReport.releasedAt ? new Date(viewingReport.releasedAt).toLocaleString() : 'N/A'}</div>
                <div><strong>Reporting Radiologist:</strong> {viewingReport.radiologistName}</div>
                <div><strong>Status:</strong> <span style={{ fontWeight: '700', color: '#16a34a' }}>{viewingReport.status}</span></div>
              </div>

              {viewingReport.isAmended && viewingReport.amendmentReason && (
                <div style={{ padding: '12px', borderRadius: '8px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', marginBottom: '18px' }}>
                  <strong>[AMENDED REPORT AUDIT NOTE]:</strong> {viewingReport.amendmentReason}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Clinical History</h4>
                <p style={{ margin: 0 }}>{viewingReport.clinicalHistory || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Technique & Protocol</h4>
                <p style={{ margin: 0 }}>{viewingReport.technique || 'Standard Protocol'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Radiological Findings</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewingReport.findings}</p>
              </div>

              <div style={{ marginBottom: '16px', background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Diagnostic Impression</h4>
                <p style={{ margin: 0, fontWeight: '600', color: '#14532d', whiteSpace: 'pre-wrap' }}>{viewingReport.impression}</p>
              </div>

              {viewingReport.recommendations && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Recommendations</h4>
                  <p style={{ margin: 0 }}>{viewingReport.recommendations}</p>
                </div>
              )}

              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
                <div>Verified & Signed Digitally by: <strong>{viewingReport.verifiedByName || viewingReport.radiologistName}</strong></div>
                <div>Certified Hospital Electronic Medical Record</div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                <Printer size={16} /> Print Report
              </button>
              <button
                onClick={() => setViewingReport(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amend Report Modal */}
      {amendingReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '640px', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Amend Released Radiology Report
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 16px 0' }}>
              Original Report: <strong>{amendingReport.reportNumber}</strong> (v{amendingReport.reportVersion}). A new auditable version will be released, preserving the complete previous report in history.
            </p>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmAmendment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#b91c1c', marginBottom: '6px' }}>Amendment Reason * (Auditable)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Additional clinical history provided by neurosurgeon, subtle fissure identified..."
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Updated Findings</label>
                <textarea
                  rows="4"
                  required
                  value={amendedFindings}
                  onChange={(e) => setAmendedFindings(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Updated Impression</label>
                <textarea
                  rows="2"
                  required
                  value={amendedImpression}
                  onChange={(e) => setAmendedImpression(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAmendingReport(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAmendment}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#d97706', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submittingAmendment ? 'Amending...' : 'Submit Versioned Amendment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyReports;
