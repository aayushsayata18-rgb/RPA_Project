import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Search, ExternalLink, RefreshCw, FileText, Activity, ShieldCheck } from 'lucide-react';

export const Studies = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listStudies({ search });
      if (res.data?.data) {
        setStudies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch studies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudies();
  };

  const handleSyncPacs = async (accessionNumber) => {
    setSyncing(true);
    try {
      await radiologyService.syncPacsMetadata({ accessionNumber });
      alert(`PACS metadata successfully synchronized for accession ${accessionNumber}`);
      fetchStudies();
      if (selectedStudy) {
        const updated = await radiologyService.getStudyById(selectedStudy._id);
        setSelectedStudy(updated.data?.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Radiology Imaging Studies Archive
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Accession number directory, DICOM series metadata and enterprise PACS link
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Accession Number, Patient Name, Modality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <button type="submit" style={{ padding: '9px 18px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </div>

      {/* Studies Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 16px' }}>Accession Number</th>
              <th style={{ padding: '14px 16px' }}>Patient Name</th>
              <th style={{ padding: '14px 16px' }}>Examination</th>
              <th style={{ padding: '14px 16px' }}>Modality & Room</th>
              <th style={{ padding: '14px 16px' }}>Performed At</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading studies...</td></tr>
            ) : studies.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No imaging studies recorded.</td></tr>
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
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {s.modalityType} • {s.room}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {s.performedDateTime ? new Date(s.performedDateTime).toLocaleString() : 'Pending'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      background: s.studyStatus === 'COMPLETED' || s.studyStatus === 'REPORTED' ? '#dcfce7' : '#eff6ff',
                      color: s.studyStatus === 'COMPLETED' || s.studyStatus === 'REPORTED' ? '#15803d' : '#1d4ed8'
                    }}>
                      {s.studyStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedStudy(s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      DICOM Metadata
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DICOM Metadata Modal */}
      {selectedStudy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '580px', borderRadius: '14px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                DICOM & PACS Metadata
              </h3>
              <button onClick={() => setSelectedStudy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
              <div style={{ marginBottom: '8px' }}><strong>Accession Number:</strong> {selectedStudy.accessionNumber}</div>
              <div style={{ marginBottom: '8px' }}><strong>Patient:</strong> {selectedStudy.patientName}</div>
              <div style={{ marginBottom: '8px' }}><strong>Examination:</strong> {selectedStudy.examName}</div>
              <div style={{ marginBottom: '8px' }}><strong>PACS Study ID:</strong> {selectedStudy.externalPacsStudyId || 'Not synced'}</div>
              <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}><strong>Study Instance UID:</strong> {selectedStudy.externalStudyUID || 'Not synced'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Technician:</strong> {selectedStudy.performedByName || 'N/A'}</div>
              {selectedStudy.contrastAdministered && (
                <div style={{ marginBottom: '8px', color: '#d97706' }}>
                  <strong>Contrast Administered:</strong> {selectedStudy.contrastDetails?.agent} ({selectedStudy.contrastDetails?.volumeMl} ml)
                </div>
              )}
              {selectedStudy.technicianNotes && (
                <div style={{ marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <strong>Technician Notes:</strong> {selectedStudy.technicianNotes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                onClick={() => handleSyncPacs(selectedStudy.accessionNumber)}
                disabled={syncing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} /> {syncing ? 'Syncing...' : 'Sync PACS Metadata'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudy(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studies;
