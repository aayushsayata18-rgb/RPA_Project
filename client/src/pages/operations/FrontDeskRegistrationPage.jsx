import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const FrontDeskRegistrationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('FAST_SEARCH'); // 'FAST_SEARCH' or 'NEW_PATIENT'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // New Patient Form
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'UNKNOWN',
    mobile: '',
    email: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyName: '',
    emergencyRelationship: 'Relative',
    emergencyMobile: '',
    idType: 'AADHAAR',
    idReference: '',
    visitType: 'OPD',
    department: 'GENERAL_MEDICINE',
    chiefComplaint: '',
    priority: 'NORMAL'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await patientService.searchPatients({ query: searchQuery.trim(), limit: 10 });
      setSearchResults(res?.data?.patients || []);
      if (res?.data?.patients?.length === 0) {
        setError('No existing patient found in Patient Master. You can register as a New Patient.');
      }
    } catch (err) {
      setError(err.message || 'Failed to search patients.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectExisting = (patient) => {
    setSelectedPatient(patient);
    setDuplicateWarning(`Selected Patient: ${patient.fullName} (${patient.patientId}). Submitting will create a new Visit encounter for this permanent identity.`);
  };

  const handleRegisterExisting = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setError('');
    try {
      const res = await patientService.submitRegistration({
        existingPatientId: selectedPatient.patientId,
        source: 'FRONT_DESK',
        visitType: formData.visitType,
        department: formData.department,
        chiefComplaint: formData.chiefComplaint,
        priority: formData.priority
      });

      if (res?.success) {
        navigate('/register/success', {
          state: {
            registrationData: res.data,
            patientName: selectedPatient.fullName
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to register existing patient visit.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      source: 'FRONT_DESK',
      visitType: formData.visitType,
      department: formData.department,
      chiefComplaint: formData.chiefComplaint,
      priority: formData.priority,
      patient: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        mobile: formData.mobile,
        email: formData.email,
        address: {
          line1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          country: 'India',
          postalCode: formData.postalCode
        },
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          mobile: formData.emergencyMobile
        },
        identityDocuments: formData.idReference
          ? [{ type: formData.idType, reference: formData.idReference, verified: true }]
          : []
      }
    };

    try {
      const res = await patientService.submitRegistration(payload);
      if (res?.success) {
        if (res.data.status === 'IDENTITY_VERIFICATION_REQUIRED') {
          navigate('/front-desk/identity-review', {
            state: { message: 'Ambiguous match detected. Navigated to Identity Review.' }
          });
        } else {
          navigate('/register/success', {
            state: {
              registrationData: res.data,
              patientName: `${formData.firstName} ${formData.lastName}`
            }
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to create patient registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Front-Desk Patient Registration</h1>
          <p className="page-subtitle">Operations Desk • Permanent Master Intake & Encounter Creation</p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('FAST_SEARCH');
              setError('');
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'FAST_SEARCH' ? '#0284c7' : 'transparent',
              color: activeTab === 'FAST_SEARCH' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <Search size={16} /> Search & Quick Visit
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('NEW_PATIENT');
              setError('');
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'NEW_PATIENT' ? '#0284c7' : 'transparent',
              color: activeTab === 'NEW_PATIENT' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <UserPlus size={16} /> New Patient Registration
          </button>
        </div>
      </div>

      {error && (
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
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: Fast Search & Existing Patient Registration */}
      {activeTab === 'FAST_SEARCH' && (
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '1rem' }}>
              1. Search Existing Patient Master Record
            </h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient ID (P10001), Phone, Full Name..."
                className="input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={searching}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {searching ? <Activity size={16} className="animate-spin" /> : <Search size={16} />} Search
              </button>
            </form>

            {/* Results Table */}
            {searchResults.length > 0 && (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>PID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Mobile</th>
                      <th style={{ padding: '0.75rem 1rem' }}>DOB / Gender</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((p) => {
                      const isSelected = selectedPatient?.patientId === p.patientId;
                      return (
                        <tr
                          key={p.patientId}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <strong style={{ color: '#38bdf8' }}>{p.patientId}</strong>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600 }}>{p.fullName}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{p.mobile}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                            {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'} ({p.gender})
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectExisting(p)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #0284c7',
                                background: isSelected ? '#0284c7' : 'transparent',
                                color: isSelected ? '#fff' : '#38bdf8',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {isSelected ? 'Selected' : 'Select Patient'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Visit Details Form for Selected Existing Patient */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '1rem' }}>
              2. New Visit Encounter
            </h3>

            {selectedPatient ? (
              <div className="space-y-3">
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>SELECTED PATIENT</div>
                  <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem' }}>{selectedPatient.fullName}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>PID: {selectedPatient.patientId} • Phone: {selectedPatient.mobile}</div>
                </div>

                <div>
                  <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Visit Type</label>
                  <select
                    value={formData.visitType}
                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="OPD">OPD Consultation</option>
                    <option value="FOLLOW_UP">Follow-Up Encounter</option>
                    <option value="DIAGNOSTIC">Diagnostic Screening</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.2rem' }}>Chief Complaint</label>
                  <input
                    type="text"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    placeholder="e.g. Acute stomach pain"
                    className="input text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRegisterExisting}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle2 size={16} /> {loading ? 'Creating Visit...' : 'Create Visit Encounter'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <UserCheck size={40} style={{ margin: '0 auto 0.75rem', color: '#475569' }} />
                <p style={{ fontSize: '0.875rem' }}>Search and select an existing patient to attach a new encounter Visit ID.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Full New Patient Registration Form */}
      {activeTab === 'NEW_PATIENT' && (
        <div className="card">
          <form onSubmit={handleRegisterNew} className="space-y-4">
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              New Patient Demographic Intake
            </h3>

            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="Middle name"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  DOB <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Gender <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="input"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Mobile <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="input"
                >
                  <option value="UNKNOWN">Select</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="O+">O+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="O-">O-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Aadhaar / National ID
                </label>
                <input
                  type="text"
                  value={formData.idReference}
                  onChange={(e) => setFormData({ ...formData, idReference: e.target.value })}
                  placeholder="ID Number reference"
                  className="input"
                />
              </div>
            </div>

            {/* Visit Details */}
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>
              Initial Visit Encounter Details
            </h3>
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input"
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
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Visit Type
                </label>
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  className="input"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="FOLLOW_UP">Follow-Up</option>
                  <option value="DIAGNOSTIC">Diagnostic</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Chief Complaint
                </label>
                <input
                  type="text"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Reason for visit"
                  className="input"
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={16} /> {loading ? 'Registering...' : 'Register Patient & Issue Visit ID'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
