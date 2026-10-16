import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Play, CheckCircle, Clock, AlertTriangle, Radio, FileText, Activity } from 'lucide-react';

export const ProcedureQueue = () => {
  const [activeQueue, setActiveQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Complete Scan Modal
  const [completingStudy, setCompletingStudy] = useState(null);
  const [pacsStudyId, setPacsStudyId] = useState('');
  const [studyUID, setStudyUID] = useState('');
  const [contrastAdministered, setContrastAdministered] = useState(false);
  const [contrastDetails, setContrastDetails] = useState({ agent: '', volumeMl: 50, batchLot: '' });
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [orderRes, studyRes] = await Promise.all([
        radiologyService.listOrders({ status: 'CHECKED_IN' }),
        radiologyService.listStudies({ studyStatus: 'IN_PROGRESS' })
      ]);

      const checkedInOrders = (orderRes.data?.data || []).map(o => ({
        type: 'AWAITING_START',
        orderId: o.orderId,
        orderDbId: o._id,
        patientName: o.patientName,
        examName: o.examNameSnapshot,
        modalityType: o.modalityTypeSnapshot,
        priority: o.priority,
        raw: o
      }));

      const inProgressStudies = (studyRes.data?.data || []).map(s => ({
        type: 'IN_PROGRESS',
        studyId: s.studyId,
        studyDbId: s._id,
        accessionNumber: s.accessionNumber,
        patientName: s.patientName,
        examName: s.examName,
        modalityType: s.modalityType,
        room: s.room,
        startTime: s.performedDateTime,
        raw: s
      }));

      setActiveQueue([...inProgressStudies, ...checkedInOrders]);
    } catch (err) {
      console.error('Failed to fetch procedure queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStartScan = async (item) => {
    try {
      await radiologyService.startExamination(item.orderDbId, {
        room: 'CT Suite 1'
      });
      setMessage(`Examination started for order ${item.orderId}. Study accession number generated.`);
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenCompleteModal = (item) => {
    setCompletingStudy(item);
    setPacsStudyId(`PACS-${item.accessionNumber}`);
    setStudyUID(`1.2.840.10008.5.1.4.1.1.${Date.now()}`);
    setContrastAdministered(false);
    setTechnicianNotes('');
  };

  const handleConfirmCompleteScan = async (e) => {
    e.preventDefault();
    if (!completingStudy) return;
    setSubmitting(true);

    try {
      await radiologyService.completeExamination(completingStudy.studyDbId, {
        externalPacsStudyId: pacsStudyId,
        externalStudyUID: studyUID,
        contrastAdministered,
        contrastDetails,
        technicianNotes
      });

      setMessage(`Study ${completingStudy.accessionNumber} marked as COMPLETED. Forwarded to Radiologist Reporting Queue.`);
      setCompletingStudy(null);
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Technician Procedure & Scan Workstation
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
          Live examination execution, accession number assignment, and PACS image metadata link
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
          <span>Active Patient Procedure Queue ({activeQueue.length})</span>
          <button onClick={fetchQueue} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Refresh</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 16px' }}>Status & Identifier</th>
              <th style={{ padding: '14px 16px' }}>Patient Name</th>
              <th style={{ padding: '14px 16px' }}>Examination</th>
              <th style={{ padding: '14px 16px' }}>Modality</th>
              <th style={{ padding: '14px 16px' }}>Stage</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Workstation Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading procedure queue...</td></tr>
            ) : activeQueue.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No active procedures in queue.</td></tr>
            ) : (
              activeQueue.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0284c7' }}>
                      {item.type === 'IN_PROGRESS' ? item.accessionNumber : item.orderId}
                    </div>
                    {item.startTime && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Started: {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                    {item.patientName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.examName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                      {item.modalityType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      background: item.type === 'IN_PROGRESS' ? '#fef3c7' : '#dcfce7',
                      color: item.type === 'IN_PROGRESS' ? '#b45309' : '#15803d'
                    }}>
                      {item.type === 'IN_PROGRESS' ? 'SCAN IN PROGRESS' : 'READY TO SCAN'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {item.type === 'AWAITING_START' ? (
                      <button
                        onClick={() => handleStartScan(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Play size={14} /> Start Scan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCompleteModal(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle size={14} /> Complete Scan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Scan Modal */}
      {completingStudy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '540px', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Finalize Imaging Scan Acquisition
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 16px 0' }}>
              Accession: <strong>{completingStudy.accessionNumber}</strong> • Patient: <strong>{completingStudy.patientName}</strong>
            </p>

            <form onSubmit={handleConfirmCompleteScan}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>PACS Study ID</label>
                <input
                  type="text"
                  value={pacsStudyId}
                  onChange={(e) => setPacsStudyId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>DICOM Study Instance UID</label>
                <input
                  type="text"
                  value={studyUID}
                  onChange={(e) => setStudyUID(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: contrastAdministered ? '10px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={contrastAdministered}
                    onChange={(e) => setContrastAdministered(e.target.checked)}
                  />
                  Intravenous / Oral Contrast Administered
                </label>

                {contrastAdministered && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Contrast Agent (e.g. Omnipaque 350)"
                      value={contrastDetails.agent}
                      onChange={(e) => setContrastDetails({ ...contrastDetails, agent: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      placeholder="Volume (ml)"
                      value={contrastDetails.volumeMl}
                      onChange={(e) => setContrastDetails({ ...contrastDetails, volumeMl: Number(e.target.value) })}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Technician Technical Notes</label>
                <textarea
                  rows="2"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Patient tolerance, scan series parameters, artifacts..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCompletingStudy(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Complete & Send to Radiologist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcedureQueue;
