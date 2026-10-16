import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { ShieldCheck, Edit, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const ReportingQueue = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Report Editor Modal
  const [reportingStudy, setReportingStudy] = useState(null);
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [technique, setTechnique] = useState('');
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchReportingQueue = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listStudies({ studyStatus: 'COMPLETED' });
      if (res.data?.data) {
        setStudies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reporting queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportingQueue();
  }, []);

  const openEditor = (study) => {
    setReportingStudy(study);
    setClinicalHistory(`Clinical indication: ${study.examName}`);
    setTechnique(`Standard ${study.modalityType} protocol without contraindication`);
    setFindings('');
    setImpression('');
    setRecommendations('');
    setError('');
  };

  const handleSaveDraft = async () => {
    if (!findings || !impression) {
      setError('Findings and Impression fields are required.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await radiologyService.createReport({
        studyId: reportingStudy._id,
        clinicalHistory,
        technique,
        findings,
        impression,
        recommendations
      });

      setMessage(`Draft report ${res.data?.data?.reportNumber || ''} created.`);
      setReportingStudy(null);
      fetchReportingQueue();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndFinalize = async () => {
    if (!findings || !impression) {
      setError('Findings and Impression fields are required before finalizing.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      // 1. Create or save draft
      const draftRes = await radiologyService.createReport({
        studyId: reportingStudy._id,
        clinicalHistory,
        technique,
        findings,
        impression,
        recommendations
      });

      const reportId = draftRes.data?.data?._id;

      // 2. Verify & finalize
      await radiologyService.verifyReport(reportId);

      // 3. Release report
      await radiologyService.releaseReport(reportId);

      setMessage(`Report verified, finalized and released to Patient & Doctor portals.`);
      setReportingStudy(null);
      fetchReportingQueue();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Radiologist Diagnostic Reporting Workstation
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
          Completed imaging examination queue, structured findings interpretation, verification and release
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', marginBottom: '20px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* Queue Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
          <span>Unreported Imaging Studies ({studies.length})</span>
          <button onClick={fetchReportingQueue} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Refresh Queue</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 16px' }}>Accession Number</th>
              <th style={{ padding: '14px 16px' }}>Patient Name</th>
              <th style={{ padding: '14px 16px' }}>Examination</th>
              <th style={{ padding: '14px 16px' }}>Modality</th>
              <th style={{ padding: '14px 16px' }}>Scan Completed</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Diagnostic Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading reporting queue...</td></tr>
            ) : studies.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>All completed studies have been reported! Queue is clear.</td></tr>
            ) : (
              studies.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>
                    {s.accessionNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                    {s.patientName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {s.examName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                      {s.modalityType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {s.completedDateTime ? new Date(s.completedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditor(s)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={14} /> Enter Report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Structured Report Editor Modal */}
      {reportingStudy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '780px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Radiology Diagnostic Report Editor
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Accession: <strong>{reportingStudy.accessionNumber}</strong> • Patient: <strong>{reportingStudy.patientName}</strong> • Exam: <strong>{reportingStudy.examName}</strong>
                </div>
              </div>
              <button onClick={() => setReportingStudy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '16px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Clinical History</label>
                  <input
                    type="text"
                    value={clinicalHistory}
                    onChange={(e) => setClinicalHistory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Technique / Scan Protocol</label>
                  <input
                    type="text"
                    value={technique}
                    onChange={(e) => setTechnique(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Radiological Findings *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Detail anatomical structures, parenchymal attenuation, bone windows, soft tissues, absence or presence of acute lesions..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Impression / Conclusion *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Definitive diagnostic conclusion and summary..."
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Recommendations & Clinical Correlation</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up imaging in 6 months, correlative biopsy if indicated..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setReportingStudy(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={submitting}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyAndFinalize}
                    disabled={submitting}
                    style={{ padding: '8px 20px', borderRadius: '8px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {submitting ? 'Processing...' : 'Verify, Finalize & Release Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingQueue;
