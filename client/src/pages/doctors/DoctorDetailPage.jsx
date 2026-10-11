import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ArrowLeft,
  Stethoscope,
  Building,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  History,
  Bot,
  RefreshCw,
  Plus,
  Edit,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const DoctorDetailPage = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [availabilityExceptions, setAvailabilityExceptions] = useState([]);
  const [syncStatus, setSyncStatus] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDeptId, setTransferDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const fetchDoctorData = async () => {
    setLoading(true);
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.get(`/doctors/${doctorId}`);
      if (res.data.success) {
        setDoctor(res.data.data);
        setSchedules(res.data.data.schedules || []);
        setSyncStatus(res.data.data.syncStatus || []);
      }

      // Fetch availability exceptions
      const avlRes = await api.get(`/doctors/${doctorId}/availability`);
      if (avlRes.data.success) {
        setAvailabilityExceptions(avlRes.data.data || []);
      }

      // Fetch audit logs for this doctor
      try {
        const auditRes = await api.get(`/audit`, { params: { entityId: doctorId } });
        if (auditRes.data.success) {
          setAuditLogs(auditRes.data.data || auditRes.data.events || []);
        }
      } catch (e) {
        // Audit fetch optional
      }
    } catch (err) {
      console.error('Failed to load doctor profile:', err.message);
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/doctors/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err.message);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    fetchDepartments();
  }, [doctorId]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.patch(`/doctors/${doctorId}/status`, {
        status: targetStatus,
        reason: statusReason
      });
      if (res.data.success) {
        setActionMsg(`Doctor status successfully updated to ${targetStatus}!`);
        setShowStatusModal(false);
        fetchDoctorData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post(`/doctors/${doctorId}/departments/transfer`, {
        targetDepartmentId: transferDeptId,
        reason: transferReason
      });
      if (res.data.success) {
        setActionMsg('Department transfer executed successfully!');
        setShowTransferModal(false);
        fetchDoctorData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  const handleTriggerSync = async () => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post(`/doctors/${doctorId}/sync`, {
        syncType: 'PROFILE_SYNC',
        externalSystem: 'LEGACY_HIS'
      });
      if (res.data.success) {
        setActionMsg('RPA synchronization job initiated with read-back verification.');
        fetchDoctorData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  if (loading && !doctor) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="spinning" size={32} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading doctor administrative master...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page-container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Doctor Profile Not Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not find record for doctor ID: {doctorId}</p>
          <Link to="/admin/doctors" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Doctor Directory
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Stethoscope },
    { key: 'professional', label: 'Professional', icon: FileText },
    { key: 'departments', label: 'Departments', icon: Building },
    { key: 'schedule', label: 'Schedule', icon: Calendar },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'documents', label: 'Documents', icon: ShieldCheck },
    { key: 'sync', label: 'RPA Sync', icon: Bot },
    { key: 'audit', label: 'Audit Timeline', icon: History }
  ];

  return (
    <div className="page-container">
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin/doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Doctor Directory
        </Link>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {doctor.displayName || doctor.fullName}
            </h1>
            <StatusBadge status={doctor.status} />
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Doctor ID: <code>{doctor.doctorId}</code> | Primary Dept: <strong>{doctor.departmentName || doctor.departmentId}</strong> | Specialty: <strong>{doctor.specialty}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => { setTargetStatus(doctor.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE'); setShowStatusModal(true); }}>
            <UserCheck size={16} /> Change Status
          </button>
          <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>
            <Building size={16} /> Transfer Dept
          </button>
          <Link to={`/admin/doctors/${doctor.doctorId}/schedule`} className="btn btn-secondary">
            <Calendar size={16} /> Calendar View
          </Link>
          <button className="btn btn-primary" onClick={handleTriggerSync} title="Synchronize to Legacy HIS via RPA">
            <Bot size={16} /> Sync External
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle color="#10b981" size={18} />
          <span style={{ color: '#10b981', fontWeight: 600 }}>{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle color="#ef4444" size={18} />
          <span style={{ color: '#ef4444', fontWeight: 600 }}>{actionError}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                color: isActive ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Identity & Contact Details
            </h3>
            <table className="table-details" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)', width: '40%' }}>Full Legal Name:</td>
                  <td style={{ fontWeight: 600 }}>{doctor.title} {doctor.firstName} {doctor.middleName} {doctor.lastName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Official Email:</td>
                  <td>{doctor.email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Primary Contact:</td>
                  <td>{doctor.phone || doctor.contactNumber}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Alternate Contact:</td>
                  <td>{doctor.alternatePhone || '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Gender / DOB:</td>
                  <td>{doctor.gender} / {doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Employment Type:</td>
                  <td><span className="badge badge-secondary">{doctor.employmentType}</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Joining Date:</td>
                  <td>{doctor.joiningDate ? new Date(doctor.joiningDate).toLocaleDateString() : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Consultation & OPD Settings
            </h3>
            <table className="table-details" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)', width: '45%' }}>Consultation Fee:</td>
                  <td style={{ fontWeight: 600, color: '#10b981', fontSize: '1.1rem' }}>
                    ₹{doctor.consultationFee || doctor.consultationSettings?.consultationFee || 500}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Default Slot Duration:</td>
                  <td>{doctor.slotDurationMinutes || doctor.consultationSettings?.consultationDurationMinutes || 30} Minutes</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>OPD Room Location:</td>
                  <td><strong>{doctor.roomNumber}</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Current Availability:</td>
                  <td><StatusBadge status={doctor.availabilityStatus} /></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Experience:</td>
                  <td>{doctor.experienceYears} Years</td>
                </tr>
              </tbody>
            </table>

            {doctor.bio && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '4px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bio / Notes: </span>
                {doctor.bio}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Professional & Qualifications */}
      {activeTab === 'professional' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Educational Qualifications</h3>
            {doctor.qualifications && doctor.qualifications.length > 0 ? (
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Degree / Qualification</th>
                    <th>Institution / University</th>
                    <th>Year of Completion</th>
                    <th>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctor.qualifications.map((q, i) => (
                    <tr key={i}>
                      <td><strong>{q.qualification}</strong></td>
                      <td>{q.institution || '—'}</td>
                      <td>{q.year || '—'}</td>
                      <td><StatusBadge status={q.verificationStatus || 'VERIFIED'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No qualifications recorded.</p>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Medical Registration & Licenses</h3>
            {doctor.registrationDetails && doctor.registrationDetails.length > 0 ? (
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Registration Number</th>
                    <th>Registration Authority</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctor.registrationDetails.map((reg, i) => (
                    <tr key={i}>
                      <td><code>{reg.registrationNumber}</code></td>
                      <td>{reg.registrationAuthority}</td>
                      <td>{reg.issueDate ? new Date(reg.issueDate).toLocaleDateString() : '—'}</td>
                      <td>{reg.expiryDate ? new Date(reg.expiryDate).toLocaleDateString() : '—'}</td>
                      <td><StatusBadge status={reg.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No registration details recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Departments */}
      {activeTab === 'departments' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Department Assignments & History (Section 12 & 13)</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTransferModal(true)}>
              <Building size={14} /> Department Transfer
            </button>
          </div>
          {doctor.departments && doctor.departments.length > 0 ? (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Assignment Type</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {doctor.departments.map((dept, i) => (
                  <tr key={i}>
                    <td><strong>{dept.departmentName || dept.departmentId}</strong></td>
                    <td>{dept.isPrimary ? <span className="badge badge-success">Primary</span> : <span className="badge badge-secondary">Secondary</span>}</td>
                    <td>{dept.startDate ? new Date(dept.startDate).toLocaleDateString() : '—'}</td>
                    <td>{dept.endDate ? new Date(dept.endDate).toLocaleDateString() : 'Ongoing'}</td>
                    <td><StatusBadge status={dept.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Primary: {doctor.departmentName || doctor.departmentId}</p>
          )}
        </div>
      )}

      {/* Tab 4: Schedule */}
      {activeTab === 'schedule' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Configured Recurring Schedules</h3>
            <Link to={`/admin/doctors/${doctor.doctorId}/schedule`} className="btn btn-primary btn-sm">
              <Calendar size={14} /> Manage Schedule Calendar
            </Link>
          </div>
          {schedules.length > 0 ? (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Day of Week</th>
                  <th>Shift Timings</th>
                  <th>Slot Duration</th>
                  <th>Max Capacity</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch, i) => (
                  <tr key={i}>
                    <td><strong>{sch.dayOfWeekName || `Day ${sch.dayOfWeek}`}</strong></td>
                    <td><code>{sch.startTime} - {sch.endTime}</code></td>
                    <td>{sch.slotDurationMinutes} mins</td>
                    <td>{sch.maxCapacityPerSlot} patient/slot</td>
                    <td>{sch.roomNumber || doctor.roomNumber}</td>
                    <td><StatusBadge status={sch.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No recurring schedules configured yet.</p>
          )}
        </div>
      )}

      {/* Tab 5: Availability */}
      {activeTab === 'availability' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Availability Exceptions & Blocked Slots (Section 24)</h3>
          {availabilityExceptions.length > 0 ? (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {availabilityExceptions.map((ex, i) => (
                  <tr key={i}>
                    <td>{ex.dateStr || new Date(ex.date).toLocaleDateString()}</td>
                    <td><code>{ex.startTime} - {ex.endTime}</code></td>
                    <td><StatusBadge status={ex.status} /></td>
                    <td>{ex.reason || '—'}</td>
                    <td><span className="badge badge-info">{ex.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No availability exceptions recorded for this doctor.</p>
          )}
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Uploaded Credential Documents (Section 44)</h3>
          {doctor.documents && doctor.documents.length > 0 ? (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Title</th>
                  <th>Uploaded At</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {doctor.documents.map((doc, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-secondary">{doc.documentType}</span></td>
                    <td>{doc.title || 'Attached Document'}</td>
                    <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      {doc.documentUrl ? (
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <ExternalLink size={14} /> Open
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No documents attached.</p>
          )}
        </div>
      )}

      {/* Tab 7: RPA Sync */}
      {activeTab === 'sync' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>External System Synchronization History (Section 38 & 72)</h3>
            <button className="btn btn-primary btn-sm" onClick={handleTriggerSync}>
              <Bot size={14} /> Sync to Legacy HIS
            </button>
          </div>
          {syncStatus.length > 0 ? (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>External System</th>
                  <th>Sync Type</th>
                  <th>Status</th>
                  <th>Read-Back Verified</th>
                  <th>Last Synced</th>
                  <th>Correlation ID</th>
                </tr>
              </thead>
              <tbody>
                {syncStatus.map((sync, i) => (
                  <tr key={i}>
                    <td><strong>{sync.externalSystem}</strong></td>
                    <td><code>{sync.syncType}</code></td>
                    <td><StatusBadge status={sync.status} /></td>
                    <td>{sync.verifiedByReadBack ? <CheckCircle size={16} color="#10b981" /> : '—'}</td>
                    <td>{sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : 'Pending'}</td>
                    <td><code style={{ fontSize: '0.75rem' }}>{sync.correlationId}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No external sync jobs recorded yet.</p>
          )}
        </div>
      )}

      {/* Tab 8: Audit Timeline */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Audit Event Log (Section 65)</h3>
          {auditLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditLogs.map((log, i) => (
                <div key={i} style={{ padding: '0.75rem', borderLeft: '3px solid #38bdf8', background: 'var(--bg-card)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Action: <strong>{log.action}</strong> by {log.userId} ({log.role})</span>
                    <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>{log.details || log.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No audit entries recorded for doctor {doctorId}.</p>
          )}
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '440px', padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Update Doctor Status</h3>
            <form onSubmit={handleStatusChange}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Status</label>
                <select className="form-control" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} required>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Reason / Administrative Justification</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Credential review approved / Doctor requested annual leave..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Transfer Modal */}
      {showTransferModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '480px', padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Doctor Department Transfer Workflow</h3>
            <form onSubmit={handleTransfer}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Target Department</label>
                <select className="form-control" value={transferDeptId} onChange={(e) => setTransferDeptId(e.target.value)} required>
                  <option value="">Select Target Department...</option>
                  {departments
                    .filter((d) => d.departmentId !== doctor.departmentId)
                    .map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name} ({d.code})</option>
                    ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Reason for Transfer</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Internal reorganization / requested by head of department..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
