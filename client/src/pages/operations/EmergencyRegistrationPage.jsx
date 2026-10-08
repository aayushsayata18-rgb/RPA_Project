import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Activity,
  User,
  Search,
  PlusCircle,
  FileText
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const EmergencyRegistrationPage = () => {
  const [activeRecords, setActiveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Emergency Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    provisionalName: 'Unknown Emergency Patient',
    estimatedAge: '',
    gender: 'MALE',
    mobile: '',
    apparentCondition: 'Acute trauma intake',
    broughtByName: 'First Responder / Ambulance',
    broughtByContact: '',
    notes: ''
  });

  // Linking Modal State
  const [selectedTempRecord, setSelectedTempRecord] = useState(null);
  const [linkTargetPid, setLinkTargetPid] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);

  useEffect(() => {
    fetchEmergencyRecords();
  }, []);

  const fetchEmergencyRecords = async () => {
    setLoading(true);
    try {
      const res = await patientService.listEmergencyRecords({ status: 'ACTIVE' });
      if (res?.data) {
        setActiveRecords(res.data);
      }
    } catch (err) {
      console.error('Failed to load emergency records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        provisionalName: intakeForm.provisionalName,
        estimatedAge: intakeForm.estimatedAge ? Number(intakeForm.estimatedAge) : undefined,
        gender: intakeForm.gender,
        mobile: intakeForm.mobile || undefined,
        apparentCondition: intakeForm.apparentCondition,
        broughtBy: {
          name: intakeForm.broughtByName,
          relationship: 'First Responder',
          contact: intakeForm.broughtByContact
        },
        notes: intakeForm.notes
      };

      const res = await patientService.submitEmergencyRegistration(payload);
      if (res?.success) {
        if (res.data.isTemporary) {
          setSuccessMsg(
            `Emergency Intake Created! Temporary ID: [${res.data.temporaryEmergencyId}], Emergency Visit ID: [${res.data.visitId}]. Patient can be linked once identity is verified.`
          );
        } else {
          setSuccessMsg(
            `Matched existing Patient [${res.data.patientId} - ${res.data.patientName}]. Emergency Visit [${res.data.visitId}] generated.`
          );
        }
        setIntakeForm({
          provisionalName: 'Unknown Emergency Patient',
          estimatedAge: '',
          gender: 'MALE',
          mobile: '',
          apparentCondition: 'Acute trauma intake',
          broughtByName: 'First Responder / Ambulance',
          broughtByContact: '',
          notes: ''
        });
        fetchEmergencyRecords();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process emergency registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkRecord = async (e) => {
    e.preventDefault();
    if (!selectedTempRecord || !linkTargetPid.trim()) return;
    setLinkingLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await patientService.linkEmergencyRecord(selectedTempRecord.temporaryEmergencyId, {
        targetPatientId: linkTargetPid.trim()
      });

      if (res?.success) {
        setSuccessMsg(
          `Temporary record ${selectedTempRecord.temporaryEmergencyId} linked to permanent Patient ID ${res.data.permanentPatientId}. Historical encounter visits preserved.`
        );
        setSelectedTempRecord(null);
        setLinkTargetPid('');
        fetchEmergencyRecords();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to link emergency record.');
    } finally {
      setLinkingLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Emergency Trauma Registration</h1>
          <p className="page-subtitle">Operations Portal • Zero-Delay Emergency Intake & Identity Linking</p>
        </div>
        <span
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <AlertOctagon size={16} /> EMERGENCY DESK ACTIVE
        </span>
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
          <AlertOctagon size={20} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        {/* Left Column: Rapid Intake Form */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <form onSubmit={handleIntakeSubmit} className="space-y-3">
            <h3 style={{ fontSize: '1.15rem', color: '#f87171', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={18} /> Rapid Emergency Intake
            </h3>

            <div>
              <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                Provisional Patient Identifier / Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={intakeForm.provisionalName}
                onChange={(e) => setIntakeForm({ ...intakeForm, provisionalName: e.target.value })}
                placeholder="e.g. Unknown Trauma Male 30s"
                className="input text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Est. Age</label>
                <input
                  type="number"
                  value={intakeForm.estimatedAge}
                  onChange={(e) => setIntakeForm({ ...intakeForm, estimatedAge: e.target.value })}
                  placeholder="e.g. 35"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Gender</label>
                <select
                  value={intakeForm.gender}
                  onChange={(e) => setIntakeForm({ ...intakeForm, gender: e.target.value })}
                  className="input text-sm"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNDISCLOSED">Undisclosed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                Phone / Relative Contact (Optional for Auto-Match)
              </label>
              <input
                type="tel"
                value={intakeForm.mobile}
                onChange={(e) => setIntakeForm({ ...intakeForm, mobile: e.target.value })}
                placeholder="If patient has phone"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                Apparent Clinical Condition
              </label>
              <input
                type="text"
                value={intakeForm.apparentCondition}
                onChange={(e) => setIntakeForm({ ...intakeForm, apparentCondition: e.target.value })}
                placeholder="e.g. Blunt thoracic trauma, unconscious"
                className="input text-sm"
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Brought By</label>
                <input
                  type="text"
                  value={intakeForm.broughtByName}
                  onChange={(e) => setIntakeForm({ ...intakeForm, broughtByName: e.target.value })}
                  placeholder="Name"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Contact</label>
                <input
                  type="text"
                  value={intakeForm.broughtByContact}
                  onChange={(e) => setIntakeForm({ ...intakeForm, broughtByContact: e.target.value })}
                  placeholder="Phone"
                  className="input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-danger"
              style={{
                width: '100%',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
              }}
            >
              <AlertOctagon size={16} /> {submitting ? 'Creating Intake...' : 'Issue Temporary ID & Emergency Visit'}
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Active Temporary Emergency Records & Linking */}
        <div className="card" style={{ gridColumn: 'span 2', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Active Temporary Emergency Cases</h3>
              <p className="text-secondary text-xs">Patients awaiting definitive identity verification & Master linking</p>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
              {activeRecords.length} Active Temp IDs
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading emergency cases...</div>
          ) : activeRecords.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No active temporary emergency cases pending linking.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Temporary ID</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Provisional Name</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Age / Gender</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Emergency Visit</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Brought By</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.map((rec) => (
                    <tr
                      key={rec.temporaryEmergencyId}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <strong style={{ color: '#f87171' }}>{rec.temporaryEmergencyId}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', fontWeight: 600 }}>
                        {rec.provisionalName}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                        {rec.estimatedAge || 'Unknown'} / {rec.gender}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#38bdf8' }}>
                        {rec.emergencyVisitId}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                        {rec.broughtBy?.name || 'Ambulance'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTempRecord(rec)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <LinkIcon size={14} /> Link Permanent PID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Link Temporary Record to Permanent Patient */}
      {selectedTempRecord && (
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
              Link Temporary Emergency Record
            </h3>
            <p className="text-secondary text-xs" style={{ marginBottom: '1.25rem' }}>
              Linking Temporary ID <strong>{selectedTempRecord.temporaryEmergencyId}</strong> ({selectedTempRecord.provisionalName}) to permanent Patient Master.
            </p>

            <form onSubmit={handleLinkRecord} className="space-y-4">
              <div>
                <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Target Permanent Patient ID (e.g. P10001) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={linkTargetPid}
                  onChange={(e) => setLinkTargetPid(e.target.value)}
                  placeholder="Enter PID (e.g. P10001)"
                  className="input text-sm"
                  required
                />
              </div>

              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#bae6fd'
                }}
              >
                All medical orders, nursing entries, and visit encounters created under{' '}
                <strong>{selectedTempRecord.temporaryEmergencyId}</strong> will automatically migrate under the selected Patient ID while preserving audit traceability.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTempRecord(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingLoading || !linkTargetPid.trim()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <LinkIcon size={16} /> {linkingLoading ? 'Linking...' : 'Confirm Identity Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
