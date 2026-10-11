import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  UserPlus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Building,
  Shield,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

export const StaffCreatePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    email: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '',
    country: 'India',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    employeeType: 'BILLING',
    employmentType: 'FULL_TIME',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    departmentId: 'DEP-BILLING',
    roleCode: 'BILLING_STAFF',
    managerName: '',
    comments: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Run duplicate check on blur of phone, email, or name
  const handleDuplicateCheck = async () => {
    if (!formData.email && !formData.phone && (!formData.firstName || !formData.lastName)) return;
    setCheckingDuplicates(true);
    try {
      const res = await staffService.checkDuplicates({
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth
      });
      if (res.hasDuplicates && res.matches?.length > 0) {
        setDuplicateWarning(res.matches);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Duplicate check failed:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        alternatePhone: formData.alternatePhone,
        address: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone
        },
        employeeType: formData.employeeType,
        employmentType: formData.employmentType,
        designation: formData.designation,
        joiningDate: new Date(formData.joiningDate),
        departmentId: formData.departmentId,
        roleCode: formData.roleCode,
        managerName: formData.managerName,
        comments: formData.comments
      };

      const res = await staffService.createEmployee(payload);
      if (res.success && res.data) {
        navigate(`/administration/staff/${res.data.employeeId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create employee record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link to="/administration/staff" className="btn btn-outline-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Directory
          </Link>
          <div>
            <h2 className="h4 mb-0" style={{ fontWeight: '700' }}>Staff Onboarding & Master Registration</h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
              Create permanent employee master profile, department placement, and initiate access authorization workflow.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Alert Notice */}
      {duplicateWarning && (
        <div className="alert alert-warning mb-4" style={{ borderRadius: '10px' }}>
          <div className="d-flex align-items-center gap-2 mb-2 font-weight-bold">
            <AlertTriangle size={20} className="text-warning" />
            <strong>Potential Existing Employee Detected:</strong>
          </div>
          <p className="mb-2" style={{ fontSize: '0.9rem' }}>
            The phone number, email, or name entered matches existing employee records in the system. Please verify to prevent duplicate identities:
          </p>
          <ul className="mb-0 ps-3">
            {duplicateWarning.map((m, i) => (
              <li key={i} style={{ fontSize: '0.85rem' }}>
                <Link to={`/administration/staff/${m.employeeId}`} className="fw-bold text-dark text-decoration-underline">
                  {m.employeeId} - {m.displayName}
                </Link>{' '}
                ({m.designation}, {m.department}) | Status: {m.status} | Phone: {m.phone} | Email: {m.email}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Personal & Contact */}
          <div className="col-12 col-lg-6">
            {/* Personal Details Card */}
            <div
              className="card p-3 mb-4"
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '12px'
              }}
            >
              <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <UserPlus size={18} className="text-info" /> Personal Information
              </h5>

              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>First Name *</label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleDuplicateCheck}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Gender *</label>
                  <select
                    name="gender"
                    className="form-select bg-dark border-secondary text-white"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="e.g. 9820011111"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Official / Personal Email *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="staff@hospital.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.addressLine1}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div
              className="card p-3 mb-4"
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '12px'
              }}
            >
              <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <Phone size={18} className="text-warning" /> Emergency Contact
              </h5>
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Relationship</label>
                  <input
                    type="text"
                    name="emergencyContactRelationship"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="e.g. Spouse, Parent"
                    value={formData.emergencyContactRelationship}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Emergency Phone</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Employment & Role */}
          <div className="col-12 col-lg-6">
            {/* Employment Details Card */}
            <div
              className="card p-3 mb-4"
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '12px'
              }}
            >
              <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <Building size={18} className="text-success" /> Employment & Placement Details
              </h5>

              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Staff Category / Type *</label>
                  <select
                    required
                    name="employeeType"
                    className="form-select bg-dark border-secondary text-white"
                    value={formData.employeeType}
                    onChange={handleChange}
                  >
                    <option value="BILLING">BILLING (Cashier & Billing Staff)</option>
                    <option value="NURSE">NURSE (Clinical Nursing Staff)</option>
                    <option value="PHARMACIST">PHARMACIST (Pharmacy Dispensary)</option>
                    <option value="LAB_TECHNICIAN">LAB_TECHNICIAN (Pathology Lab)</option>
                    <option value="RADIOLOGY_TECHNICIAN">RADIOLOGY_TECHNICIAN (Imaging)</option>
                    <option value="RECEPTIONIST">RECEPTIONIST (Front Desk)</option>
                    <option value="HOUSEKEEPING">HOUSEKEEPING (Facilities & Ward)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Engineering)</option>
                    <option value="HR">HR (Human Resources)</option>
                    <option value="ADMINISTRATION">ADMINISTRATION</option>
                    <option value="PROCUREMENT">PROCUREMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Employment Type *</label>
                  <select
                    required
                    name="employmentType"
                    className="form-select bg-dark border-secondary text-white"
                    value={formData.employmentType}
                    onChange={handleChange}
                  >
                    <option value="FULL_TIME">Full Time Permanent</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract Basis</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="CONSULTANT">Consultant</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Designation Title *</label>
                  <input
                    type="text"
                    required
                    name="designation"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="e.g. Billing Executive, Senior Staff Nurse"
                    value={formData.designation}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Joining Date *</label>
                  <input
                    type="date"
                    required
                    name="joiningDate"
                    className="form-control bg-dark border-secondary text-white"
                    value={formData.joiningDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Assigned Primary Department *</label>
                  <select
                    required
                    name="departmentId"
                    className="form-select bg-dark border-secondary text-white"
                    value={formData.departmentId}
                    onChange={handleChange}
                  >
                    <option value="DEP-BILLING">Billing & Cashier (DEP-BILLING)</option>
                    <option value="DEP-FINANCE">Finance & Accounts (DEP-FINANCE)</option>
                    <option value="DEP-RECEPTION">Front Desk & Reception (DEP-RECEPTION)</option>
                    <option value="DEP-NURSING">Nursing & Inpatient Care (DEP-NURSING)</option>
                    <option value="DEP-PHARMACY">Pharmacy Services (DEP-PHARMACY)</option>
                    <option value="DEP-LAB">Pathology Lab (DEP-LAB)</option>
                    <option value="DEP-RAD">Radiology & Imaging (DEP-RAD)</option>
                    <option value="DEP-HK">Housekeeping & Sanitation (DEP-HK)</option>
                    <option value="DEP-MAINT">Facilities & Maintenance (DEP-MAINT)</option>
                    <option value="DEP-HR">Human Resources (DEP-HR)</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Reporting Manager Name</label>
                  <input
                    type="text"
                    name="managerName"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="e.g. Dept Supervisor / Head"
                    value={formData.managerName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Application Access Role Card */}
            <div
              className="card p-3 mb-4"
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '12px'
              }}
            >
              <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <Shield size={18} className="text-info" /> Application Role & Access Authorization
              </h5>
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Initial Portal RBAC Role *</label>
                <select
                  required
                  name="roleCode"
                  className="form-select bg-dark border-secondary text-white"
                  value={formData.roleCode}
                  onChange={handleChange}
                >
                  <option value="BILLING_STAFF">BILLING_STAFF (Invoicing, Payments & Queries)</option>
                  <option value="NURSE">NURSE (Clinical Vitals, Roster, Inpatient Rounds)</option>
                  <option value="PHARMACIST">PHARMACIST (Prescriptions & Dispensing)</option>
                  <option value="LAB_TECHNICIAN">LAB_TECHNICIAN (Pathology & Orders)</option>
                  <option value="RADIOLOGY_TECHNICIAN">RADIOLOGY_TECHNICIAN (Imaging Desk)</option>
                  <option value="RECEPTIONIST">RECEPTIONIST (Patient Reg, OPD Check-in)</option>
                  <option value="HOUSEKEEPING">HOUSEKEEPING (Bed Status & Cleaning Tasks)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Equipment & Work Orders)</option>
                  <option value="HR_MANAGER">HR_MANAGER (Staff Master & Onboarding)</option>
                  <option value="ADMIN_MANAGER">ADMIN_MANAGER (Administrative Operations)</option>
                </select>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Upon managerial onboarding approval, an Access Request will be queued for System Administrator approval and provisioning.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Onboarding Review Comments / Notes</label>
                <textarea
                  name="comments"
                  rows="3"
                  className="form-control bg-dark border-secondary text-white"
                  placeholder="Verification notes, credentials check, background remarks..."
                  value={formData.comments}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submission Actions */}
            <div className="d-flex justify-content-end gap-2">
              <Link to="/administration/staff" className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={submitting}>
                <CheckCircle size={16} />
                {submitting ? 'Registering Staff...' : 'Submit Staff Onboarding'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StaffCreatePage;
