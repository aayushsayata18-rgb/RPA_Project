import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import patientRecordService from '../../services/patientRecordService';
import { PatientSummaryCard } from '../../components/patient/PatientSummaryCard';
import { PatientTimeline } from '../../components/patient/PatientTimeline';
import { DocumentLibrary } from '../../components/patient/DocumentLibrary';
import {
  FileText,
  Clock,
  Calendar,
  CreditCard,
  FlaskConical,
  Radio,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  User,
  ShieldCheck,
  BedDouble
} from 'lucide-react';

export const PatientRecordsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState({});
  const [billing, setBilling] = useState(null);
  const [labOrders, setLabOrders] = useState([]);
  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [visits, setVisits] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ mobile: '', email: '', line1: '', emergencyName: '', emergencyMobile: '' });
  const [updateSuccess, setUpdateSuccess] = useState('');

  const patientId = user?.linkedEntityId || user?.patientId || 'P10045';

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, timelineRes, docsRes, billingRes, labRes, radRes, visitsRes] = await Promise.all([
        patientRecordService.getPatientSummary(patientId),
        patientRecordService.getPatientTimeline(patientId),
        patientRecordService.getPatientDocuments(patientId),
        patientRecordService.getPatientBilling(patientId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientLaboratory(patientId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientRadiology(patientId).catch(() => ({ data: { data: {} } })),
        patientRecordService.getPatientVisits(patientId).catch(() => ({ data: { data: {} } }))
      ]);

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
        const p = summaryRes.data.data.patient;
        setProfileForm({
          mobile: p.mobile || '',
          email: p.email || '',
          line1: p.address?.line1 || '',
          emergencyName: p.emergencyContact?.name || '',
          emergencyMobile: p.emergencyContact?.mobile || ''
        });
      }

      if (timelineRes.data?.success) {
        setTimeline(timelineRes.data.data.events || []);
      }

      if (docsRes.data?.success) {
        setDocuments(docsRes.data.data.documents || []);
        setCategories(docsRes.data.data.categories || {});
      }

      if (billingRes.data?.success) {
        setBilling(billingRes.data.data);
      }

      if (labRes.data?.success) {
        setLabOrders(labRes.data.data.laboratoryOrders || []);
      }

      if (radRes.data?.success) {
        setRadiologyOrders(radRes.data.data.radiologyOrders || []);
      }

      if (visitsRes.data?.success) {
        setVisits(visitsRes.data.data.visits || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading patient record portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        mobile: profileForm.mobile,
        email: profileForm.email,
        address: { line1: profileForm.line1 },
        emergencyContact: { name: profileForm.emergencyName, mobile: profileForm.emergencyMobile }
      };

      const res = await patientRecordService.updatePatientProfile(patientId, {
        updates: payload,
        reason: 'Patient self-service portal update'
      });

      if (res.data?.success) {
        setUpdateSuccess('Your profile contact information was updated and audited successfully.');
        setTimeout(() => setUpdateSuccess(''), 4000);
        setEditModalOpen(false);
        loadPatientData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.02em' }}>
            My Health & Hospital Records
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Unified longitudinal record of your hospital visits, diagnostic reports, invoices, and documents
          </p>
        </div>

        <button
          onClick={loadPatientData}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-primary, #f8fafc)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={15} />
          <span>Refresh Records</span>
        </button>
      </div>

      {updateSuccess && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{updateSuccess}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Header Card */}
      <PatientSummaryCard summary={summary} onEditProfile={() => setEditModalOpen(true)} isStaff={false} />

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'timeline', label: 'Timeline', icon: Clock, count: timeline.length },
          { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
          { id: 'billing', label: 'Bills & Payments', icon: CreditCard, count: billing?.invoices?.length || 0 },
          { id: 'diagnostics', label: 'Lab & Scans', icon: FlaskConical, count: labOrders.length + radiologyOrders.length },
          { id: 'encounters', label: 'Visits & OPD', icon: Calendar, count: visits.length }
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
                padding: '0.6rem 1.1rem',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#0f172a' : 'var(--text-secondary, #94a3b8)',
                  borderRadius: '10px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'timeline' && <PatientTimeline events={timeline} loading={loading} />}

      {activeTab === 'documents' && (
        <DocumentLibrary
          documents={documents}
          categories={categories}
          patientId={patientId}
          onRefresh={loadPatientData}
        />
      )}

      {activeTab === 'billing' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Invoices & Financial Statements</h3>
          {billing?.invoices?.length === 0 ? (
            <p style={{ color: 'var(--text-muted, #64748b)' }}>No invoices on record.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {billing?.invoices?.map((inv) => (
                <div key={inv.invoiceId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#38bdf8' }}>Invoice #{inv.invoiceId}</span>
                      <span style={{ background: inv.status === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: inv.status === 'PAID' ? '#22c55e' : '#f43f5e', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {inv.status}
                      </span>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      Date: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()} • Items: {inv.items?.length || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
                      Payable: ₹{inv.payableAmount?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: inv.outstandingBalance > 0 ? '#f43f5e' : '#22c55e' }}>
                      {inv.outstandingBalance > 0 ? `Due: ₹${inv.outstandingBalance?.toLocaleString()}` : 'Settled in Full'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Lab Reports Card */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#14b8a6' }}>
              <FlaskConical size={20} />
              <span>Laboratory Diagnostic Reports</span>
            </h3>
            {labOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted, #64748b)' }}>No lab reports available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {labOrders.map((lab) => (
                  <div key={lab.orderId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{lab.testName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#14b8a6', background: 'rgba(20, 184, 166, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {lab.resultStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.3rem' }}>
                      Date: {new Date(lab.reportDate || lab.orderDate).toLocaleDateString()} • Order: {lab.orderId}
                    </div>
                    {lab.results && lab.results.length > 0 && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontSize: '0.8rem' }}>
                        {lab.results.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                            <span>{r.parameter}:</span>
                            <strong>{r.value} {r.unit}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radiology Scans Card */}
          <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7' }}>
              <Radio size={20} />
              <span>Radiology & Scans</span>
            </h3>
            {radiologyOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted, #64748b)' }}>No radiology records available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {radiologyOrders.map((rad) => (
                  <div key={rad.orderId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{rad.procedureName} ({rad.modality})</strong>
                      <span style={{ fontSize: '0.75rem', color: '#a855f7', background: 'rgba(168, 85, 247, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {rad.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.3rem' }}>
                      Date: {new Date(rad.reportDate || rad.orderDate).toLocaleDateString()} • {rad.radiologistName || 'Department'}
                    </div>
                    {rad.conclusion && (
                      <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '4px' }}>
                        <strong>Conclusion:</strong> {rad.conclusion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'encounters' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Hospital Visits & Encounters</h3>
          {visits.length === 0 ? (
            <p style={{ color: 'var(--text-muted, #64748b)' }}>No visit records found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visits.map((v) => (
                <div key={v.visitId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>{v.visitId}</strong> ({v.visitType})
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.2rem' }}>
                      Doctor: {v.doctorName} • Department: {v.departmentName || v.department}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                    <div>{new Date(v.visitDate).toLocaleDateString()}</div>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>{v.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Edit Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Update Profile Information</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Changes to contact details are automatically verified and logged in your profile change audit history.
            </p>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Phone Number</label>
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Residential Address</label>
                <input
                  type="text"
                  value={profileForm.line1}
                  onChange={(e) => setProfileForm({ ...profileForm, line1: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Emergency Contact Name</label>
                <input
                  type="text"
                  value={profileForm.emergencyName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsPage;
