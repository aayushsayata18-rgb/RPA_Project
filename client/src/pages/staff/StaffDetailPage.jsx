import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  ArrowLeft,
  Building,
  Shield,
  Clock,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Send,
  Upload,
  Briefcase,
  History,
  Phone,
  Mail,
  MapPin,
  CheckSquare
} from 'lucide-react';

export const StaffDetailPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComments, setApproveComments] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    newDepartmentId: 'DEP-FINANCE',
    newDepartmentName: 'Finance & Accounts',
    newDesignation: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    newRoleCode: '',
    reason: ''
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docData, setDocData] = useState({
    documentType: 'IDENTITY',
    documentName: '',
    documentUrl: ''
  });

  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [offboardData, setOffboardData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: 'Voluntary Resignation',
    noticePeriodServed: true
  });

  const fetchStaffDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, histRes, accRes, docRes] = await Promise.all([
        staffService.getEmployeeById(employeeId),
        staffService.getEmployeeHistory(employeeId).catch(() => ({ data: [] })),
        staffService.getEmployeeAccess(employeeId).catch(() => ({ requests: [] })),
        staffService.getEmployeeDocuments(employeeId).catch(() => ({ data: [] }))
      ]);

      if (empRes.data) {
        setEmployee(empRes.data);
      } else {
        setError('Employee record not found.');
      }
      if (histRes.data) setHistory(histRes.data);
      if (accRes.requests) setAccessRequests(accRes.requests);
      if (docRes.data) setDocuments(docRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [employeeId]);

  // Actions
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await staffService.approveEmployee(employeeId, approveComments);
      setSuccessMessage('Staff onboarding approved successfully. Status set to ACTIVE.');
      setShowApproveModal(false);
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      await staffService.rejectEmployee(employeeId, rejectReason);
      setSuccessMessage('Staff onboarding rejected.');
      setShowRejectModal(false);
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await staffService.transferEmployee(employeeId, transferData);
      setSuccessMessage('Department transfer executed successfully.');
      setShowTransferModal(false);
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await staffService.addEmployeeDocument(employeeId, docData);
      setSuccessMessage('Document uploaded and archived with versioning.');
      setShowDocModal(false);
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOffboard = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await staffService.offboardEmployee(employeeId, offboardData);
      setSuccessMessage('Staff offboarding initiated and access revoked.');
      setShowOffboardModal(false);
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChecklistToggle = async (index, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await staffService.updateOffboardingChecklist(employeeId, index, { status: newStatus });
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTriggerSync = async () => {
    setActionLoading(true);
    try {
      await staffService.syncEmployee(employeeId, {
        externalSystem: 'EXTERNAL_HR_SYSTEM',
        syncType: 'UPDATE'
      });
      setSuccessMessage('Synchronization task queued with RPA runner.');
      fetchStaffDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <RefreshCw size={24} className="spin mb-2" />
        <p>Loading employee record {employeeId}...</p>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="container-fluid py-5 text-center text-danger">
        <AlertTriangle size={32} className="mb-2" />
        <h4>{error}</h4>
        <Link to="/administration/staff" className="btn btn-outline-secondary mt-3">
          Back to Directory
        </Link>
      </div>
    );
  }

  const getStatusBadge = (st) => {
    const config = {
      ACTIVE: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' },
      PENDING_APPROVAL: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15' },
      ON_LEAVE: { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' },
      SUSPENDED: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
      TERMINATED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
    };
    const c = config[st] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' };
    return (
      <span style={{ background: c.bg, color: c.text, padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600' }}>
        {st}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Back Link & Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Link to="/administration/staff" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <ArrowLeft size={16} /> Directory
        </Link>
        <div className="d-flex gap-2">
          {employee.status === 'ACTIVE' && (
            <>
              <button className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" onClick={() => setShowTransferModal(true)}>
                <Building size={14} /> Transfer Department
              </button>
              <button className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1" onClick={handleTriggerSync} disabled={actionLoading}>
                <RefreshCw size={14} /> Trigger External Sync
              </button>
              <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={() => setShowOffboardModal(true)}>
                <UserX size={14} /> Offboard Staff
              </button>
            </>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchStaffDetails}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Staff Banner Card */}
      <div
        className="card p-3 mb-4"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.25rem'
              }}
            >
              {employee.firstName?.[0]}{employee.lastName?.[0]}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3 className="h4 mb-0" style={{ fontWeight: '700' }}>
                  {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                </h3>
                <span className="badge bg-dark border text-info font-monospace" style={{ fontSize: '0.85rem' }}>
                  {employee.employeeId}
                </span>
                {getStatusBadge(employee.status)}
              </div>
              <div className="d-flex align-items-center gap-3 mt-1 text-muted" style={{ fontSize: '0.875rem' }}>
                <span>{employee.designation}</span>
                <span>•</span>
                <span>{employee.departmentAssignments?.[0]?.departmentName || 'No Department'}</span>
                <span>•</span>
                <span>{employee.employmentType}</span>
                <span>•</span>
                <span className="badge bg-secondary">Access: {employee.accessProvisioningStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approval Action Banner */}
        {employee.status === 'PENDING_APPROVAL' && (
          <div
            className="mt-3 p-3 rounded d-flex justify-content-between align-items-center flex-wrap gap-2"
            style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)' }}
          >
            <div className="d-flex align-items-center gap-2 text-warning">
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                Staff record is pending administrative onboarding approval before system activation.
              </span>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => setShowApproveModal(true)}>
                <UserCheck size={14} /> Approve Employment
              </button>
              <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => setShowRejectModal(true)}>
                <UserX size={14} /> Reject Application
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4 border-secondary">
        {[
          { id: 'overview', label: 'Overview & Profile' },
          { id: 'department', label: 'Department Assignments' },
          { id: 'access', label: 'Role & Access Control' },
          { id: 'documents', label: 'Documents' },
          { id: 'offboarding', label: 'Offboarding Checklist' },
          { id: 'history', label: 'Audit Timeline' }
        ].map((tab) => (
          <li key={tab.id} className="nav-item">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active bg-transparent text-info border-info border-bottom-0' : 'text-muted'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontWeight: '600', fontSize: '0.9rem' }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Contents */}
      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
              <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Personal Information</h5>
              <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Full Name</span>
                  <span className="fw-semibold">{employee.displayName}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Gender</span>
                  <span>{employee.gender}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Date of Birth</span>
                  <span>{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Phone Number</span>
                  <span className="font-monospace">{employee.phone}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Email Address</span>
                  <span>{employee.email}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Address</span>
                  <span className="text-end">
                    {employee.address?.addressLine1 ? `${employee.address.addressLine1}, ${employee.address.city}, ${employee.address.state}` : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card p-3 mb-4" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
              <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Employment Profile</h5>
              <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Staff Category</span>
                  <span className="badge bg-info text-dark">{employee.employeeType}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Employment Term</span>
                  <span>{employee.employmentType}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Joining Date</span>
                  <span>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                  <span className="text-muted">Reporting Manager</span>
                  <span>{employee.managerName || 'None assigned'}</span>
                </div>
                {employee.leavingDate && (
                  <div className="d-flex justify-content-between py-1 text-danger">
                    <span>Termination Date</span>
                    <span>{new Date(employee.leavingDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {employee.emergencyContact?.name && (
              <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
                <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Emergency Contact</h5>
                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                    <span className="text-muted">Name</span>
                    <span>{employee.emergencyContact.name} ({employee.emergencyContact.relationship})</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Phone</span>
                    <span>{employee.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Department Assignments */}
      {activeTab === 'department' && (
        <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0" style={{ fontSize: '1rem', fontWeight: '600' }}>Department Assignments & Transfer History</h5>
            {employee.status === 'ACTIVE' && (
              <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setShowTransferModal(true)}>
                <Building size={14} /> New Department Transfer
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
              <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                <tr>
                  <th>Department ID</th>
                  <th>Department Name</th>
                  <th>Primary</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Assignment Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.departmentAssignments && employee.departmentAssignments.length > 0 ? (
                  employee.departmentAssignments.map((d, i) => (
                    <tr key={i}>
                      <td className="font-monospace text-info">{d.departmentId}</td>
                      <td className="fw-semibold">{d.departmentName || d.departmentId}</td>
                      <td>{d.isPrimary ? <span className="badge bg-success">Primary</span> : <span className="badge bg-secondary">Secondary</span>}</td>
                      <td>{new Date(d.startDate).toLocaleDateString()}</td>
                      <td>{d.endDate ? new Date(d.endDate).toLocaleDateString() : 'Present'}</td>
                      <td>
                        <span className={`badge ${d.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No department assignments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Role & Access Control */}
      {activeTab === 'access' && (
        <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1" style={{ fontSize: '1rem', fontWeight: '600' }}>Access Requests & Role Entitlements</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Managed access requests subject to Separation of Duties approval workflow.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
              <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                <tr>
                  <th>Request ID</th>
                  <th>Role Code</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Approved By</th>
                  <th>Provisioned At</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessRequests.length > 0 ? (
                  accessRequests.map((req) => (
                    <tr key={req.requestId}>
                      <td className="font-monospace text-info">{req.requestId}</td>
                      <td className="fw-semibold">{req.requestedRoleCode}</td>
                      <td><span className="badge bg-secondary">{req.source}</span></td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: req.status === 'PROVISIONED' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                            color: req.status === 'PROVISIONED' ? '#4ade80' : '#facc15'
                          }}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td>{req.requestedBy}</td>
                      <td>{req.approvedBy || '-'}</td>
                      <td>{req.provisionedAt ? new Date(req.provisionedAt).toLocaleDateString() : '-'}</td>
                      <td className="text-end">
                        {req.status === 'APPROVED' && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={async () => {
                              await staffService.provisionAccess(req.requestId);
                              fetchStaffDetails();
                            }}
                          >
                            Provision
                          </button>
                        )}
                        {req.status === 'PROVISIONED' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                              await staffService.revokeAccess(req.requestId, 'Administrative revocation');
                              fetchStaffDetails();
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">No access requests recorded for this staff member.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Documents */}
      {activeTab === 'documents' && (
        <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0" style={{ fontSize: '1rem', fontWeight: '600' }}>Employment & Identity Documents</h5>
            <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setShowDocModal(true)}>
              <Upload size={14} /> Upload Document
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
              <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                <tr>
                  <th>Doc ID</th>
                  <th>Document Type</th>
                  <th>Title / Name</th>
                  <th>Version</th>
                  <th>Uploaded At</th>
                  <th>Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc, i) => (
                    <tr key={i}>
                      <td className="font-monospace text-info">{doc.documentId}</td>
                      <td><span className="badge bg-secondary">{doc.documentType}</span></td>
                      <td className="fw-semibold">{doc.documentName}</td>
                      <td><span className="badge bg-info text-dark">v{doc.version || 1}</span></td>
                      <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td>{doc.uploadedBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No documents uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Offboarding Checklist */}
      {activeTab === 'offboarding' && (
        <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
          <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Offboarding & Clearance Tasks</h5>
          {employee.terminationDetails?.offboardingChecklist && employee.terminationDetails.offboardingChecklist.length > 0 ? (
            <div className="list-group">
              {employee.terminationDetails.offboardingChecklist.map((task, idx) => (
                <div
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary mb-2 rounded"
                >
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleChecklistToggle(idx, task.status)}
                    />
                    <span className={task.status === 'COMPLETED' ? 'text-decoration-line-through text-muted' : 'fw-semibold'}>
                      {task.item}
                    </span>
                  </div>
                  <div>
                    <span className={`badge ${task.status === 'COMPLETED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Staff member is actively employed. Offboarding checklist is generated upon termination.</p>
          )}
        </div>
      )}

      {/* 6. History / Audit */}
      {activeTab === 'history' && (
        <div className="card p-3" style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px' }}>
          <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Lifecycle Audit Event Timeline</h5>
          <div className="timeline ps-3" style={{ borderLeft: '2px solid var(--border-color, #334155)' }}>
            {history.length > 0 ? (
              history.map((h, i) => (
                <div key={i} className="mb-3 position-relative ps-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-info text-dark" style={{ fontSize: '0.75rem' }}>{h.eventType}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(h.createdAt).toLocaleString()}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>by {h.actor}</span>
                  </div>
                  <div className="mt-1" style={{ fontSize: '0.875rem' }}>{h.reason || h.notes || 'Status or state update'}</div>
                </div>
              ))
            ) : (
              <p className="text-muted mb-0">No history events logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproveModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Approve Staff Onboarding</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowApproveModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to approve employment for <strong>{employee.displayName}</strong>?</p>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Reviewer Comments</label>
                  <textarea
                    rows="3"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Enter approval remarks..."
                    value={approveComments}
                    onChange={(e) => setApproveComments(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>Confirm Approval</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Reject Staff Application</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Please specify mandatory rejection reason for <strong>{employee.displayName}</strong>:</p>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Rejection Reason *</label>
                  <textarea
                    required
                    rows="3"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. Incomplete credentials, failed background check..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>Reject Application</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Transfer Modal */}
      {showTransferModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleTransfer}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">Department Transfer</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowTransferModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>New Department *</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={transferData.newDepartmentId}
                      onChange={(e) => setTransferData({ ...transferData, newDepartmentId: e.target.value })}
                    >
                      <option value="DEP-FINANCE">Finance & Accounts (DEP-FINANCE)</option>
                      <option value="DEP-BILLING">Billing & Cashier (DEP-BILLING)</option>
                      <option value="DEP-RECEPTION">Front Desk & Reception (DEP-RECEPTION)</option>
                      <option value="DEP-PHARMACY">Pharmacy Services (DEP-PHARMACY)</option>
                      <option value="DEP-LAB">Pathology Lab (DEP-LAB)</option>
                      <option value="DEP-RAD">Radiology (DEP-RAD)</option>
                      <option value="DEP-HR">Human Resources (DEP-HR)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>New Designation</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="e.g. Senior Billing Executive"
                      value={transferData.newDesignation}
                      onChange={(e) => setTransferData({ ...transferData, newDesignation: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Effective Date *</label>
                    <input
                      type="date"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      value={transferData.effectiveDate}
                      onChange={(e) => setTransferData({ ...transferData, effectiveDate: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Reason for Transfer</label>
                    <textarea
                      rows="2"
                      className="form-control bg-dark text-white border-secondary"
                      value={transferData.reason}
                      onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>Execute Transfer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleAddDocument}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">Upload Staff Document</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDocModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Document Type *</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={docData.documentType}
                      onChange={(e) => setDocData({ ...docData, documentType: e.target.value })}
                    >
                      <option value="IDENTITY">IDENTITY (Govt ID, Aadhar, PAN)</option>
                      <option value="ADDRESS">ADDRESS (Proof of Residence)</option>
                      <option value="QUALIFICATION">QUALIFICATION (Degree, Certificate)</option>
                      <option value="EMPLOYMENT">EMPLOYMENT (Previous Relieving)</option>
                      <option value="CONTRACT">CONTRACT (Appointment Letter)</option>
                      <option value="POLICY_ACKNOWLEDGEMENT">POLICY_ACKNOWLEDGEMENT</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Document Name / Description *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="e.g. National ID Copy"
                      value={docData.documentName}
                      onChange={(e) => setDocData({ ...docData, documentName: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Storage Key / File Path</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="e.g. /secure-docs/staff/aadhar.pdf"
                      value={docData.documentUrl}
                      onChange={(e) => setDocData({ ...docData, documentUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>Upload Document</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Offboarding Modal */}
      {showOffboardModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleOffboard}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">Initiate Staff Offboarding</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowOffboardModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-warning" style={{ fontSize: '0.9rem' }}>
                    <AlertTriangle size={16} /> Offboarding will revoke active system access, cancel future shift assignments, and queue clearance tasks.
                  </p>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Termination Date *</label>
                    <input
                      type="date"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      value={offboardData.terminationDate}
                      onChange={(e) => setOffboardData({ ...offboardData, terminationDate: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Reason for Termination</label>
                    <textarea
                      rows="2"
                      className="form-control bg-dark text-white border-secondary"
                      value={offboardData.reason}
                      onChange={(e) => setOffboardData({ ...offboardData, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOffboardModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={actionLoading}>Confirm Offboarding</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetailPage;
