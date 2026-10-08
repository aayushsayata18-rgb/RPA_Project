import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Activity, FileText, Plus, ShieldCheck } from 'lucide-react';
import { patientService } from '../../services/patientService';

export const PatientVisitsPage = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const patientId = user?.linkedEntityId || 'P10001';

  useEffect(() => {
    fetchVisitsAndPatient();
  }, [patientId]);

  const fetchVisitsAndPatient = async () => {
    setLoading(true);
    try {
      const [pRes, vRes] = await Promise.all([
        patientService.getPatientById(patientId),
        patientService.getPatientVisits(patientId)
      ]);
      if (pRes?.data) setPatient(pRes.data);
      if (vRes?.data) setVisits(vRes.data);
    } catch (err) {
      console.error('Failed to fetch patient visits:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Visit Encounters</h1>
          <p className="page-subtitle">
            Permanent Patient ID: <strong style={{ color: '#38bdf8' }}>{patientId}</strong> • Total Encounters:{' '}
            {visits.length}
          </p>
        </div>
      </div>

      {/* Architectural Concept Banner */}
      <div
        style={{
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <ShieldCheck size={32} color="#38bdf8" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            Permanent Master Identity Guarantee
          </h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Your permanent Patient ID (<strong>{patientId}</strong>) remains invariant across all lifetime interactions.
            Each hospital consultation creates a separate encounter Visit ID (e.g. <em>V202610...</em>) for complete clinical and billing traceability.
          </p>
        </div>
      </div>

      {/* Visits Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Hospital Encounters History</h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sorted by recent date</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading encounters...</div>
        ) : visits.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No visit encounters recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Visit ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Encounter Date</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Department</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Chief Complaint</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((vis) => (
                  <tr
                    key={vis.visitId}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#38bdf8' }}>{vis.visitId}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#e2e8f0' }}>
                      {new Date(vis.visitDate).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            vis.visitType === 'EMERGENCY'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : vis.visitType === 'FOLLOW_UP'
                              ? 'rgba(99, 102, 241, 0.2)'
                              : 'rgba(2, 132, 199, 0.2)',
                          color:
                            vis.visitType === 'EMERGENCY'
                              ? '#f87171'
                              : vis.visitType === 'FOLLOW_UP'
                              ? '#a5b4fc'
                              : '#38bdf8'
                        }}
                      >
                        {vis.visitType}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#e2e8f0' }}>
                      {vis.department?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1', maxWidth: '250px' }}>
                      {vis.chiefComplaint || 'Consultation'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            vis.status === 'COMPLETED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color: vis.status === 'COMPLETED' ? '#10b981' : '#fbbf24'
                        }}
                      >
                        {vis.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {vis.registrationSource}
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
