import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/staffService';
import {
  User,
  Building,
  Shield,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export const StaffSelfProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit Phone / Contact Request
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Find employee by user linkedEntityId or email
      const employeeId = user?.linkedEntityId || user?.userId;
      if (employeeId) {
        const res = await staffService.getEmployeeById(employeeId);
        if (res.data) {
          setProfile(res.data);
          setPhone(res.data.phone || '');
          setAlternatePhone(res.data.alternatePhone || '');
        }
      } else {
        // Fallback: search by user email
        const res = await staffService.getEmployees({ search: user?.email, limit: 1 });
        if (res.employees && res.employees.length > 0) {
          setProfile(res.employees[0]);
          setPhone(res.employees[0].phone || '');
          setAlternatePhone(res.employees[0].alternatePhone || '');
        }
      }
    } catch (err) {
      console.error('Failed to load self profile:', err);
      setError('Could not locate linked employee record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await staffService.updateEmployee(profile.employeeId, {
        phone,
        alternatePhone,
        reason: 'Employee self-service contact update'
      });
      setSuccess('Contact details updated successfully.');
      fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to update contact info.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <RefreshCw size={24} className="spin mb-2" />
        <p>Loading your staff profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <User size={32} className="mb-2 text-warning" />
        <h4>Employee Profile Not Linked</h4>
        <p>Your login account does not currently link to an active administrative Employee record.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="h4 mb-1" style={{ fontWeight: '700' }}>My Employee Self-Service Profile</h2>
        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
          View your administrative placement, approved application role, and request contact information updates.
        </p>
      </div>

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Official Profile Attributes (Read-Only) */}
        <div className="col-12 col-lg-7">
          <div
            className="card p-3 mb-4"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-secondary">
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
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
              <div>
                <h4 className="h5 mb-0" style={{ fontWeight: '700' }}>{profile.displayName}</h4>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge bg-dark border text-info font-monospace">{profile.employeeId}</span>
                  <span className="badge bg-success">{profile.status}</span>
                </div>
              </div>
            </div>

            <h6 className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
              Official Administrative Details (Protected)
            </h6>

            <div className="d-flex flex-column gap-2 mt-2" style={{ fontSize: '0.9rem' }}>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted d-flex align-items-center gap-1"><Building size={14} /> Assigned Department</span>
                <span className="fw-semibold">{profile.departmentAssignments?.[0]?.departmentName || 'General'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted">Designation</span>
                <span>{profile.designation}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted">Staff Category</span>
                <span className="badge bg-info text-dark">{profile.employeeType}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted">Employment Type</span>
                <span>{profile.employmentType}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted"><Shield size={14} /> Approved System Role</span>
                <span className="fw-semibold text-warning">{profile.roleAssignments?.[0]?.roleCode || 'Standard Access'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                <span className="text-muted"><Calendar size={14} /> Joining Date</span>
                <span>{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Official Email</span>
                <span>{profile.email}</span>
              </div>
            </div>

            <div className="mt-3 p-2 rounded bg-dark border border-secondary" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={14} className="me-1" /> Core attributes like Employee ID, Department, and System Roles are governed by hospital HR and cannot be modified via self-service.
            </div>
          </div>
        </div>

        {/* Right Column: Editable Contact Information */}
        <div className="col-12 col-lg-5">
          <div
            className="card p-3"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px'
            }}
          >
            <h5 className="mb-3" style={{ fontSize: '1rem', fontWeight: '600' }}>Update Contact Details</h5>
            <form onSubmit={handleUpdateContact}>
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Primary Phone Number *</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted"><Phone size={14} /></span>
                  <input
                    type="tel"
                    required
                    className="form-control bg-dark border-secondary text-white"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Alternate Phone</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted"><Phone size={14} /></span>
                  <input
                    type="tel"
                    className="form-control bg-dark border-secondary text-white"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Contact Details'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSelfProfilePage;
