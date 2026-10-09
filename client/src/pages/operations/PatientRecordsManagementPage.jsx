import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import patientRecordService from '../../services/patientRecordService';
import { PatientSummaryCard } from '../../components/patient/PatientSummaryCard';
import { PatientTimeline } from '../../components/patient/PatientTimeline';
import { DocumentLibrary } from '../../components/patient/DocumentLibrary';
import {
  Search,
  RefreshCw,
  Clock,
  FileText,
  CreditCard,
  ShieldCheck,
  FlaskConical,
  Radio,
  Sparkles,
  Layers,
  BedDouble,
  LogOut,
  History,
  Bot,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Plus,
  Upload,
  UserCheck,
  Edit3,
  Calendar,
  Lock
} from 'lucide-react';

export const PatientRecordsManagementPage = () => {
  const { id: paramPatientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState(paramPatientId || 'P10045');
  const [currentPatientId, setCurrentPatientId] = useState(paramPatientId || 'P10045');
  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Data states
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState({});
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [bedHistory, setBedHistory] = useState([]);
  const [discharges, setDischarges] = useState([]);
  const [billing, setBilling] = useState(null);
  const [insurance, setInsurance] = useState(null);
  const [labOrders, setLabOrders] = useState([]);
  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [pharmacyRecords, setPharmacyRecords] = useState([]);
  const [accessHistory, setAccessHistory] = useState([]);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ mobile: '', email: '', line1: '', bloodGroup: '', reason: '' });
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncPayload, setSyncPayload] = useState({ legacyPatientId: '', email: '', mobile: '' });
  const [importDocModalOpen, setImportDocModalOpen] = useState(false);
  const [importForm, setImportForm] = useState({ title: '', documentType: 'CLINICAL_REPORT', sourceDocumentId: '', checksum: '', htmlContent: '' });
  const [reconcileResult, setReconcileResult] = useState(null);

  const loadPatientData = async (targetId = currentPatientId) => {
    if (!targetId) return;
    try {
      setLoading(true);
      setError(null);
      setReconcileResult(null);

      const [
        summaryRes,
        timelineRes,
        docsRes,
        visitsRes,
        appsRes,
        admsRes,
        bedsRes,
        disRes,
        billRes,
        insRes,
        labRes,
        radRes,
        pharmRes,
        accessRes
      ] = await Promise.all([
        patientRecordService.getPatientSummary(targetId).catch(err => { throw err; }),
        patientRecordService.getPatientTimeline(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientDocuments(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientVisits(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientAppointments(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientAdmissions(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientBedHistory(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientDischarges(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientBilling(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientInsurance(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientLaboratory(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientRadiology(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientPharmacy(targetId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientAccessHistory(targetId).catch(() => ({ data: { data: {} } }))
      ]);

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
        const p = summaryRes.data.data.patient;
        setProfileForm({
          mobile: p.mobile || '',
          email: p.email || '',
          line1: p.address?.line1 || '',
          bloodGroup: p.bloodGroup || '',
          reason: 'Administrative record maintenance'
        });
      }

      setTimeline(timelineRes.data?.data?.events || []);
      setDocuments(docsRes.data?.data?.documents || []);
      setCategories(docsRes.data?.data?.categories || {});
      setVisits(visitsRes.data?.data?.visits || []);
      setAppointments(appsRes.data?.data?.appointments || []);
      setAdmissions(admsRes.data?.data?.admissions || []);
      setBedHistory(bedsRes.data?.data?.bedHistory || []);
      setDischarges(disRes.data?.data?.discharges || []);
      setBilling(billRes.data?.data || null);
      setInsurance(insRes.data?.data || null);
      setLabOrders(labRes.data?.data?.laboratoryOrders || []);
      setRadiologyOrders(radRes.data?.data?.radiologyOrders || []);
      setPharmacyRecords(pharmRes.data?.data?.pharmacyDispenses || []);
      setAccessHistory(accessRes.data?.data?.accessLogs || []);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load longitudinal record for patient ${targetId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramPatientId) {
      setCurrentPatientId(paramPatientId);
      setSearchQuery(paramPatientId);
      loadPatientData(paramPatientId);
    } else {
      loadPatientData('P10045');
    }
  }, [paramPatientId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPatientId(searchQuery.trim());
      loadPatientData(searchQuery.trim());
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await patientRecordService.updatePatientProfile(currentPatientId, {
        updates: {
          mobile: profileForm.mobile,
          email: profileForm.email,
          address: { line1: profileForm.line1 },
          bloodGroup: profileForm.bloodGroup
        },
        reason: profileForm.reason || 'Staff profile modification'
      });

      if (res.data?.success) {
        setSuccessMsg('Patient profile successfully updated and logged in change audit history.');
        setTimeout(() => setSuccessMsg(''), 4000);
        setEditModalOpen(false);
        loadPatientData(currentPatientId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleTriggerSync = async (e) => {
    e.preventDefault();
    try {
      const res = await patientRecordService.syncLegacyRecord({
        patientId: currentPatientId,
        legacyPatientId: syncPayload.legacyPatientId || currentPatientId,
        syncPayload: { email: syncPayload.email, mobile: syncPayload.mobile }
      });

      if (res.data?.success) {
        setSuccessMsg(`RPA sync completed successfully (Job: ${res.data.jobId}).`);
        setTimeout(() => setSuccessMsg(''), 5000);
        setSyncModalOpen(false);
        loadPatientData(currentPatientId);
      } else {
        alert(`RPA Sync Alert: ${res.data?.message || res.data?.errorCode}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error triggering legacy synchronization');
    }
  };

  const handleImportDocument = async (e) => {
    e.preventDefault();
    try {
      const res = await patientRecordService.importLegacyDocument({
        patientId: currentPatientId,
        title: importForm.title,
        documentType: importForm.documentType,
        sourceDocumentId: importForm.sourceDocumentId,
        checksum: importForm.checksum,
        htmlContent: importForm.htmlContent
      });

      if (res.data?.success) {
        if (res.data.duplicateDetected) {
          alert('Duplicate document detected! Redundant document creation was safely skipped.');
        } else {
          setSuccessMsg('Document successfully imported and attached to patient portfolio.');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
        setImportDocModalOpen(false);
        loadPatientData(currentPatientId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error importing document');
    }
  };

  const handleReconcile = async () => {
    try {
      const res = await patientRecordService.reconcilePatientRecord(currentPatientId);
      if (res.data?.success) {
        setReconcileResult(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error reconciling patient records');
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Top Header & Search Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.02em' }}>
              Patient Records & Longitudinal Dossier
            </h1>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              MODULE 07
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Authorized aggregation across Registration, Appointments, OPD, Admissions, Beds, Billing, Insurance, Lab & Scans
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Patient ID Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Enter Patient ID (e.g. P10045)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#0284c7',
                border: 'none',
                color: '#fff',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Load
            </button>
          </form>

          {/* RPA Sync Action */}
          <button
            onClick={() => setSyncModalOpen(true)}
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#c084fc',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Bot size={15} />
            <span>RPA Sync</span>
          </button>

          {/* Import Document Action */}
          <button
            onClick={() => setImportDocModalOpen(true)}
            style={{
              background: 'rgba(20, 184, 166, 0.15)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              color: '#14b8a6',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Upload size={15} />
            <span>Import Doc</span>
          </button>

          {/* Reconcile Action */}
          <button
            onClick={handleReconcile}
            style={{
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#eab308',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CheckCircle size={15} />
            <span>Check Integrity</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Reconciliation Alert Banner */}
      {reconcileResult && (
        <div style={{ background: reconcileResult.healthy ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', border: `1px solid ${reconcileResult.healthy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: reconcileResult.healthy ? '#22c55e' : '#eab308' }}>
            {reconcileResult.healthy ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>Cross-Module Reference Reconciliation: {reconcileResult.healthy ? '100% HEALTHY & SYNCHRONIZED' : `${reconcileResult.totalInconsistencies} Inconsistencies Detected`}</span>
          </div>
          {!reconcileResult.healthy && reconcileResult.inconsistencies?.map((inc, i) => (
            <div key={i} style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.35rem', paddingLeft: '1.5rem' }}>
              • {inc.message}
            </div>
          ))}
        </div>
      )}

      {/* Patient Master Summary Card */}
      <PatientSummaryCard summary={summary} onEditProfile={() => setEditModalOpen(true)} isStaff={true} />

      {/* Primary Staff Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'overview', label: 'Overview', icon: UserCheck },
          { id: 'timeline', label: 'Longitudinal Timeline', icon: Clock, count: timeline.length },
          { id: 'encounters', label: 'Clinical Encounters', icon: Layers, count: visits.length + appointments.length + admissions.length },
          { id: 'beds', label: 'Bed History', icon: BedDouble, count: bedHistory.length },
          { id: 'discharges', label: 'Discharges', icon: LogOut, count: discharges.length },
          { id: 'diagnostics', label: 'Laboratory & Radiology', icon: FlaskConical, count: labOrders.length + radiologyOrders.length },
          { id: 'pharmacy', label: 'Pharmacy Dispensing', icon: Sparkles, count: pharmacyRecords.length },
          { id: 'billing', label: 'Billing & Invoices', icon: CreditCard, count: billing?.invoices?.length || 0 },
          { id: 'insurance', label: 'Insurance & Claims', icon: ShieldCheck, count: insurance?.claims?.length || 0 },
          { id: 'documents', label: 'Digital Document Library', icon: FileText, count: documents.length },
          { id: 'accessHistory', label: 'Audit & Access Trail', icon: History, count: accessHistory.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: isActive ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '0.55rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    background: isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                    color: isActive ? '#0f172a' : 'var(--text-secondary, #94a3b8)',
                    borderRadius: '10px',
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem',
                    fontWeight: '700'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Encounters */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} />
              <span>Recent Encounters</span>
            </h3>
            {visits.slice(0, 3).map((v) => (
              <div key={v.visitId} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                  <span>{v.visitId} ({v.visitType})</span>
                  <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>{v.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Doctor: {v.doctorName} • {new Date(v.visitDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Active Inpatient Episode */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BedDouble size={18} />
              <span>Inpatient Status</span>
            </h3>
            {summary?.activeAdmission ? (
              <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <strong style={{ fontSize: '1.05rem', color: '#c084fc' }}>{summary.activeAdmission.admissionId}</strong>
                <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                  Ward: {summary.activeAdmission.assignedWardName} | Bed: {summary.activeAdmission.assignedBedNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Admitting Doctor: {summary.activeAdmission.admittingDoctorName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#22c55e', marginTop: '0.3rem', fontWeight: '600' }}>
                  Status: {summary.activeAdmission.status}
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No active inpatient admission for this patient.</p>
            )}
          </div>

          {/* Financial Summary */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} />
              <span>Financial Overview</span>
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8' }}>Gross Total</span>
              <strong>₹{summary?.financialOverview?.grossTotal?.toLocaleString() || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8' }}>Paid Amount</span>
              <strong style={{ color: '#22c55e' }}>₹{summary?.financialOverview?.paidTotal?.toLocaleString() || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: '#94a3b8' }}>Outstanding Balance</span>
              <strong style={{ color: summary?.financialOverview?.outstandingBalance > 0 ? '#f43f5e' : '#22c55e', fontSize: '1.1rem' }}>
                ₹{summary?.financialOverview?.outstandingBalance?.toLocaleString() || 0}
              </strong>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && <PatientTimeline events={timeline} loading={loading} />}

      {activeTab === 'encounters' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Visits */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#10b981' }}>Visits ({visits.length})</h3>
            {visits.map((v) => (
              <div key={v.visitId} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#38bdf8' }}>{v.visitId}</strong>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>{v.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                  Doctor: {v.doctorName} • {v.departmentName || v.department}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(v.visitDate).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Appointments */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#0ea5e9' }}>Appointments ({appointments.length})</h3>
            {appointments.map((a) => (
              <div key={a.appointmentId} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#0ea5e9' }}>{a.appointmentId}</strong>
                  <span style={{ color: '#0ea5e9', fontSize: '0.75rem', fontWeight: '600' }}>{a.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                  Doctor: {a.doctorName} • Slot: {a.timeSlot || 'Scheduled'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: {new Date(a.appointmentDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          {/* Admissions */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#8b5cf6' }}>Admissions ({admissions.length})</h3>
            {admissions.map((adm) => (
              <div key={adm.admissionId} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#c084fc' }}>{adm.admissionId}</strong>
                  <span style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600' }}>{adm.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                  Ward: {adm.assignedWardName} • Bed: {adm.assignedBedNumber}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'beds' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Inpatient Bed Assignment & Transfer History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bedHistory.map((b) => (
              <div key={b.assignmentId || b._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#06b6d4', fontSize: '1rem' }}>Bed #{b.bedNumber || b.bedId}</strong> ({b.wardName || b.wardId})
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Admission: {b.admissionId} | Assigned: {new Date(b.assignedAt).toLocaleDateString()}
                    {b.releasedAt && ` → Released: ${new Date(b.releasedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <span style={{ background: b.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: b.status === 'ACTIVE' ? '#22c55e' : '#94a3b8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'discharges' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Discharge Records</h3>
          {discharges.map((dis) => (
            <div key={dis.dischargeNumber || dis._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#f43f5e', fontSize: '1.1rem' }}>Discharge #{dis.dischargeNumber}</strong>
                <span style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.85rem' }}>{dis.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                Admission: {dis.admissionId} • Type: {dis.dischargeType} • Date: {new Date(dis.dischargeDate || dis.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Gross Bill: ₹{dis.grossAmount?.toLocaleString()} | Payable: ₹{dis.payableAmount?.toLocaleString()} | Payment: {dis.paymentStatus}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Lab Orders */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#14b8a6' }}>Laboratory Diagnostic Orders</h3>
            {labOrders.map((lab) => (
              <div key={lab.orderId} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{lab.testName}</strong>
                  <span style={{ color: '#14b8a6', fontSize: '0.75rem' }}>{lab.resultStatus}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Order: {lab.orderId} • Date: {new Date(lab.orderDate).toLocaleDateString()}
                </div>
                {lab.results && lab.results.length > 0 && (
                  <div style={{ marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontSize: '0.8rem' }}>
                    {lab.results.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                        <span>{r.parameter}:</span>
                        <strong>{r.value} {r.unit}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radiology */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#a855f7' }}>Radiology Diagnostic Orders</h3>
            {radiologyOrders.map((rad) => (
              <div key={rad.orderId} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{rad.procedureName} ({rad.modality})</strong>
                  <span style={{ color: '#a855f7', fontSize: '0.75rem' }}>{rad.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Order: {rad.orderId} • Date: {new Date(rad.orderDate).toLocaleDateString()}
                </div>
                {rad.findingsSummary && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {rad.findingsSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pharmacy' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Pharmacy Dispense Records</h3>
          {pharmacyRecords.map((ph) => (
            <div key={ph.dispenseId} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#fb923c' }}>Dispense #{ph.dispenseId}</strong>
                <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: '600' }}>{ph.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Prescription: {ph.prescriptionId} | Pharmacist: {ph.dispensedByPharmacist} | Date: {new Date(ph.dispenseDate).toLocaleString()}
              </div>
              <div style={{ marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                {ph.medications?.map((m, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>{m.medicineName} ({m.dosage} - {m.frequency})</span>
                    <span>Qty: {m.quantity} | ₹{m.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'billing' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Billing Invoices & Settlement</h3>
          {billing?.invoices?.map((inv) => (
            <div key={inv.invoiceId} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>Invoice #{inv.invoiceId}</strong>
                <span style={{ background: inv.status === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: inv.status === 'PAID' ? '#22c55e' : '#f43f5e', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                  {inv.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Date: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()} | Gross: ₹{inv.grossTotal || inv.grossAmount} | Payable: ₹{inv.payableAmount} | Due: ₹{inv.outstandingBalance || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'insurance' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Insurance Policies & Claims</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {insurance?.claims?.map((clm) => (
              <div key={clm.claimId} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#38bdf8' }}>Claim #{clm.claimId}</strong>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>{clm.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Provider: {clm.providerName} | Claim Amount: ₹{clm.claimAmount?.toLocaleString()} | Approved: ₹{clm.approvedAmount?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentLibrary documents={documents} categories={categories} patientId={currentPatientId} onRefresh={() => loadPatientData(currentPatientId)} />
      )}

      {activeTab === 'accessHistory' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899' }}>
            <History size={20} />
            <span>Record Access & Audit History</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {accessHistory.map((log) => (
              <div key={log._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: log.status === 'DENIED' ? '#f43f5e' : '#38bdf8', fontWeight: '700', fontSize: '0.85rem' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                    by {log.userName || log.userId} ({log.role})
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Resource: {log.resourceType} • Purpose: {log.purpose} • IP: {log.ipAddress}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Edit Patient Profile & Record Change Reason</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              All modifications are permanently saved into the patient profile change history audit log.
            </p>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Mobile Number</label>
                <input
                  type="text"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Blood Group</label>
                <select
                  value={profileForm.bloodGroup}
                  onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">UNKNOWN</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Mandatory Reason for Modification</label>
                <input
                  type="text"
                  placeholder="e.g. Patient verified at front desk, correction of typo"
                  value={profileForm.reason}
                  onChange={(e) => setProfileForm({ ...profileForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Update & Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RPA Sync Modal */}
      {syncModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} />
              <span>RPA Legacy Record Synchronization</span>
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Triggers the RPA sync workflow to cross-verify metadata from external EHR systems. Ambiguous matches will automatically halt for human review.
            </p>

            <form onSubmit={handleTriggerSync} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Target Patient ID</label>
                <input
                  type="text"
                  value={currentPatientId}
                  disabled
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Legacy Patient ID (Optional)</label>
                <input
                  type="text"
                  placeholder="LEG-10045"
                  value={syncPayload.legacyPatientId}
                  onChange={(e) => setSyncPayload({ ...syncPayload, legacyPatientId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setSyncModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: '#8b5cf6', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Trigger RPA Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Document Modal */}
      {importDocModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={20} />
              <span>Import External / Legacy Document</span>
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Imports diagnostic or administrative record with automatic SHA-256 duplicate detection.
            </p>

            <form onSubmit={handleImportDocument} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Admission Echo Scan 2025"
                  value={importForm.title}
                  onChange={(e) => setImportForm({ ...importForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Document Category / Type</label>
                <select
                  value={importForm.documentType}
                  onChange={(e) => setImportForm({ ...importForm, documentType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="CLINICAL_REPORT">Clinical Report</option>
                  <option value="LAB_REPORT">Lab Report</option>
                  <option value="RADIOLOGY_REPORT">Radiology Report</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="INVOICE">Historical Invoice</option>
                  <option value="INSURANCE_CLAIM">Insurance Document</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Source Document ID (Deduplication reference)</label>
                <input
                  type="text"
                  placeholder="e.g. LEGACY-DOC-9001"
                  value={importForm.sourceDocumentId}
                  onChange={(e) => setImportForm({ ...importForm, sourceDocumentId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setImportDocModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: '#14b8a6', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Import Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsManagementPage;
