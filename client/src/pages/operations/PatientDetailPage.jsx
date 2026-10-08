import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  PlusCircle,
  Clock,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Visit Modal State
  const [visitForm, setVisitForm] = useState({
    visitType: 'OPD',
    department: 'GENERAL_MEDICINE',
    chiefComplaint: '',
    priority: 'NORMAL',
    notes: ''
  });

  // Edit Demographic State
  const [editForm, setEditForm] = useState({
    mobile: '',
    email: '',
    bloodGroup: '',
    address: { line1: '', city: '', state: '', postalCode: '' },
    emergencyContact: { name: '', relationship: '', mobile: '' }
  });

  useEffect(() => {
    fetchPatientDossier();
  }, [patientId]);

  const fetchPatientDossier = async () => {
    setLoading(true);
    try {
      const res = await patientService.getPatientById(patientId);
      if (res?.data) {
        setPatient(res.data);
        setEditForm({
          mobile: res.data.mobile || '',
          email: res.data.email || '',
          bloodGroup: res.data.bloodGroup || 'UNKNOWN',
          address: res.data.address || { line1: '', city: '', state: '', postalCode: '' },
          emergencyContact: res.data.emergencyContact || { name: '', relationship: '', mobile: '' }
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch patient details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    setCreatingVisit(true);
    setErrorMsg('');
    try {
      const res = await patientService.createVisit({
        patientId,
        ...visitForm
      });
      if (res?.success) {
        setSuccessMsg(`New Visit Encounter ${res.data.visitId} generated under Patient ID ${patientId}.`);
        setShowVisitModal(false);
        fetchPatientDossier();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create visit.');
    } finally {
      setCreatingVisit(false);
    }
  };

  const handleSaveDemographics = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await patientService.updatePatient(patientId, editForm);
      if (res?.success) {
        setSuccessMsg('Patient demographic updates saved & audited.');
        fetchPatientDossier();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update demographics.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p className="text-secondary">Loading patient dossier...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title">{patient?.fullName}</h1>
            <p className="page-subtitle">Permanent Master PID: <strong style={{ color: '#38bdf8' }}>{patient?.patientId}</strong></p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowVisitModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={16} /> New Visit Encounter
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#a7f3d0'
          }}
        >
          <CheckCircle2 size={20} color="#10b981" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#fca5a5'
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Profile summary & edits, Right: Encounters Timeline */}
      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        {/* Left Column: Dossier Information & Edit Demographics */}
        <div className="space-y-4">
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Master Identity Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Permanent Patient ID:</span>
                <strong style={{ color: '#38bdf8' }}>{patient?.patientId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Full Legal Name:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{patient?.fullName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Date of Birth:</span>
                <span style={{ color: '#e2e8f0' }}>{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Gender:</span>
                <span style={{ color: '#e2e8f0' }}>{patient?.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Status:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{patient?.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Registration Channel:</span>
                <span style={{ color: '#cbd5e1' }}>{patient?.registrationSource}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Initial Creation Date:</span>
                <span style={{ color: '#94a3b8' }}>{new Date(patient?.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          {/* Quick Demographics Update Form */}
          <div className="card">
            <form onSubmit={handleSaveDemographics} className="space-y-3">
              <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                Update Demographics
              </h3>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Mobile Number</label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>City</label>
                <input
                  type="text"
                  value={editForm.address?.city || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      address: { ...editForm.address, city: e.target.value }
                    })
                  }
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Emergency Contact Name & Phone</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={editForm.emergencyContact?.name || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, name: e.target.value }
                      })
                    }
                    placeholder="Name"
                    className="input text-sm"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="tel"
                    value={editForm.emergencyContact?.mobile || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergencyContact: { ...editForm.emergencyContact, mobile: e.target.value }
                      })
                    }
                    placeholder="Mobile"
                    className="input text-sm"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Save size={14} /> {savingEdit ? 'Saving...' : 'Save Demographics'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Encounters Timeline */}
        <div className="card" style={{ gridColumn: 'span 2', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Encounter Timeline</h3>
              <p className="text-secondary text-xs">All hospital visits linked to permanent PID {patient?.patientId}</p>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
              {patient?.visits?.length || 0} Encounters Recorded
            </span>
          </div>

          {!patient?.visits || patient.visits.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No previous encounters recorded for this patient.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Visit ID</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Department</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Chief Complaint</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.visits.map((vis) => (
                    <tr
                      key={vis.visitId}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <strong style={{ color: '#38bdf8' }}>{vis.visitId}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                        {new Date(vis.visitDate).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              vis.visitType === 'EMERGENCY'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(2, 132, 199, 0.2)',
                            color: vis.visitType === 'EMERGENCY' ? '#f87171' : '#38bdf8'
                          }}
                        >
                          {vis.visitType}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#e2e8f0' }}>
                        {vis.department?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                        {vis.chiefComplaint || 'General consultation'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Visit Encounter */}
      {showVisitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#1e293b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
              Create New Encounter
            </h3>
            <p className="text-secondary text-xs" style={{ marginBottom: '1.25rem' }}>
              Issuing a new Visit ID under permanent patient <strong>{patient?.fullName} ({patientId})</strong>.
            </p>

            <form onSubmit={handleCreateVisit} className="space-y-3">
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Department <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={visitForm.department}
                  onChange={(e) => setVisitForm({ ...visitForm, department: e.target.value })}
                  className="input text-sm"
                >
                  <option value="GENERAL_MEDICINE">General Medicine</option>
                  <option value="CARDIOLOGY">Cardiology</option>
                  <option value="ORTHOPEDICS">Orthopedics</option>
                  <option value="DERMATOLOGY">Dermatology</option>
                  <option value="PEDIATRICS">Pediatrics</option>
                  <option value="EMERGENCY_AND_TRAUMA">Emergency & Trauma</option>
                </select>
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Visit Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={visitForm.visitType}
                  onChange={(e) => setVisitForm({ ...visitForm, visitType: e.target.value })}
                  className="input text-sm"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="FOLLOW_UP">Follow-Up Encounter</option>
                  <option value="DIAGNOSTIC">Diagnostic Screening</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Chief Complaint / Reason
                </label>
                <input
                  type="text"
                  value={visitForm.chiefComplaint}
                  onChange={(e) => setVisitForm({ ...visitForm, chiefComplaint: e.target.value })}
                  placeholder="e.g. Chest tightness / Fever"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Priority Level
                </label>
                <select
                  value={visitForm.priority}
                  onChange={(e) => setVisitForm({ ...visitForm, priority: e.target.value })}
                  className="input text-sm"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingVisit}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle2 size={16} /> {creatingVisit ? 'Creating...' : 'Generate Visit ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
