import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Hospital,
  Activity,
  Check,
  FileText
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const OnlineRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'UNKNOWN',

    // Step 2: Contact Information
    mobile: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',

    // Step 3: Emergency Contact
    emergencyName: '',
    emergencyRelationship: 'Family',
    emergencyMobile: '',

    // Step 4: Identity & Preferences
    idType: 'AADHAAR',
    idReference: '',
    prefSms: true,
    prefEmail: true,
    prefWhatsapp: false,

    // Clinical / Visit
    visitType: 'OPD',
    department: 'GENERAL_MEDICINE',
    chiefComplaint: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  // Duplicate pre-check on step transition
  const checkDuplicateCandidates = async () => {
    if (!formData.mobile && !formData.firstName) return;
    try {
      const res = await patientService.checkDuplicates({
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth
      });

      if (res?.data?.matchStatus === 'HIGH_CONFIDENCE_MATCH') {
        setDuplicateWarning(
          `Existing Patient Record Detected: ${res.data.bestMatch.fullName} (ID: ${res.data.bestMatch.patientId}). Submitting will link your new visit directly to your permanent Patient ID.`
        );
      } else if (res?.data?.matchStatus === 'POSSIBLE_MATCH') {
        setDuplicateWarning(
          'Possible matching records found. Our front-desk team will verify and ensure your medical history remains centralized.'
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.warn('Pre-check duplicate failed (non-blocking):', err);
    }
  };

  const handleNext = async () => {
    setError(null);

    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required.');
        return;
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required.');
        return;
      }
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) {
        setError('Date of birth cannot be in the future.');
        return;
      }
    }

    if (currentStep === 2) {
      const cleaned = formData.mobile.replace(/\D/g, '');
      if (cleaned.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      await checkDuplicateCandidates();
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      source: 'ONLINE_SELF_REGISTRATION',
      visitType: formData.visitType,
      department: formData.department,
      chiefComplaint: formData.chiefComplaint,
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
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode
        },
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          mobile: formData.emergencyMobile
        },
        identityDocuments: formData.idReference
          ? [
              {
                type: formData.idType,
                reference: formData.idReference,
                verified: false
              }
            ]
          : [],
        communicationPreferences: {
          sms: formData.prefSms,
          email: formData.prefEmail,
          whatsapp: formData.prefWhatsapp
        }
      }
    };

    try {
      const res = await patientService.submitRegistration(payload);
      if (res?.success) {
        navigate('/register/success', {
          state: {
            registrationData: res.data,
            patientName: `${formData.firstName} ${formData.lastName}`
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to complete registration. Please verify details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Contact', icon: Phone },
    { num: 3, label: 'Emergency', icon: Heart },
    { num: 4, label: 'Identity & Preferences', icon: ShieldCheck },
    { num: 5, label: 'Review & Confirm', icon: CheckCircle2 }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
        padding: '2.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Header Branding */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '650px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            marginBottom: '1rem'
          }}
        >
          <Hospital size={20} color="#38bdf8" />
          <span style={{ color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            PATIENT PORTAL • ONLINE REGISTRATION
          </span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Hospital Patient Registration
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
          Register once to receive your permanent Hospital Patient ID (PID). One permanent identity for all your hospital encounters.
        </p>
      </div>

      {/* Main Form Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '800px',
          background: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(2, 132, 199, 0.15)'
        }}
      >
        {/* Step Progress Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            position: 'relative',
            padding: '0 0.5rem'
          }}
        >
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;

            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  flex: 1
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? '#10b981'
                      : isActive
                      ? '#0284c7'
                      : 'rgba(15, 23, 42, 0.8)',
                    border: `2px solid ${
                      isCompleted ? '#10b981' : isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }`,
                    color: '#fff',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 0 15px rgba(56, 189, 248, 0.5)' : 'none'
                  }}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={18} />}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: isActive ? '#38bdf8' : isCompleted ? '#10b981' : '#64748b',
                    textAlign: 'center'
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Duplicate Notice Banner */}
        {duplicateWarning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              color: '#fef3c7',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Duplicate Identity Notice:</strong> {duplicateWarning}
            </div>
          </div>
        )}

        {/* Error Alert */}
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
              color: '#fca5a5',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              Step 1: Personal Information
            </h3>
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
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
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="e.g. Kumar"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Gender <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNDISCLOSED">Undisclosed</option>
                </select>
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Blood Group
                </label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input">
                  <option value="UNKNOWN">Unknown / Select</option>
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
            </div>
          </div>
        )}

        {/* STEP 2: Contact Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              Step 2: Contact Details & Address
            </h3>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Mobile Number (10 Digits) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className="input"
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Address Line 1
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="House / Flat No., Building, Street"
                className="input"
              />
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Contact */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              Step 3: Emergency Contact Information
            </h3>
            <p className="text-secondary text-sm">
              Please specify a next of kin or emergency point of contact for medical escalations.
            </p>
            <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  placeholder="e.g. Meera Sharma"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyRelationship"
                  value={formData.emergencyRelationship}
                  onChange={handleChange}
                  placeholder="e.g. Spouse / Parent / Sibling"
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Emergency Mobile
                </label>
                <input
                  type="tel"
                  name="emergencyMobile"
                  value={formData.emergencyMobile}
                  onChange={handleChange}
                  placeholder="9876543219"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Identity & Preferences */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              Step 4: Identity Document & Communication Preferences
            </h3>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Government Identity Document Type
                </label>
                <select name="idType" value={formData.idType} onChange={handleChange} className="input">
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PAN_CARD">PAN Card</option>
                  <option value="OTHER">Other Official Photo ID</option>
                </select>
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Identity Document Number / Reference
                </label>
                <input
                  type="text"
                  name="idReference"
                  value={formData.idReference}
                  onChange={handleChange}
                  placeholder="e.g. XXXX-XXXX-1234"
                  className="input"
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '8px' }}>
              <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
                Communication & Notification Preferences
              </label>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" name="prefSms" checked={formData.prefSms} onChange={handleChange} />
                  Receive SMS Notifications
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" name="prefEmail" checked={formData.prefEmail} onChange={handleChange} />
                  Receive Email Notices & Invoices
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" name="prefWhatsapp" checked={formData.prefWhatsapp} onChange={handleChange} />
                  WhatsApp Updates
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Initial Visit Selection */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              Step 5: Review & Initial Visit Encounter Details
            </h3>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Patient Summary</h4>
                <p style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <strong>Name:</strong> {formData.firstName} {formData.middleName} {formData.lastName}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <strong>DOB / Gender:</strong> {formData.dateOfBirth} ({formData.gender})
                </p>
                <p style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <strong>Mobile:</strong> {formData.mobile}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <strong>Email:</strong> {formData.email || 'N/A'}
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Encounter Selection</h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="text-secondary text-xs" style={{ display: 'block' }}>Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="input text-sm">
                    <option value="GENERAL_MEDICINE">General Medicine</option>
                    <option value="CARDIOLOGY">Cardiology</option>
                    <option value="ORTHOPEDICS">Orthopedics</option>
                    <option value="DERMATOLOGY">Dermatology</option>
                    <option value="PEDIATRICS">Pediatrics</option>
                    <option value="ENT">ENT</option>
                  </select>
                </div>
                <div>
                  <label className="text-secondary text-xs" style={{ display: 'block' }}>Chief Complaint / Reason for Visit</label>
                  <input
                    type="text"
                    name="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={handleChange}
                    placeholder="e.g. Routine checkup / Consultation"
                    className="input text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Existing User Login
            </Link>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <Activity size={16} className="animate-spin" /> Registering...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Complete Registration
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
