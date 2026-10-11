import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  UserPlus,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Stethoscope,
  Building,
  DollarSign,
  FileText
} from 'lucide-react';

export const DoctorCreatePage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: 'Dr.',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    alternatePhone: '',
    email: '',
    departmentId: '',
    departmentName: '',
    specialty: '',
    employmentType: 'FULL_TIME',
    joiningDate: new Date().toISOString().split('T')[0],
    consultationDurationMinutes: 30,
    consultationFee: 500,
    currency: 'INR',
    roomNumber: 'OPD-101',
    bio: '',
    status: 'PENDING_APPROVAL',
    qualifications: [
      { qualification: 'MBBS', institution: '', year: 2018 }
    ],
    registrationNumber: '',
    registrationAuthority: 'National Medical Commission',
    registrationExpiryDate: '',
    notes: ''
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/doctors/departments');
        if (res.data.success) {
          const list = res.data.data || [];
          setDepartments(list);
          if (list.length > 0) {
            setFormData((prev) => ({
              ...prev,
              departmentId: list[0].departmentId,
              departmentName: list[0].name,
              specialty: list[0].specialties?.[0]?.name || ''
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err.message);
      }
    };
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departmentId') {
      const selected = departments.find((d) => d.departmentId === value);
      setFormData((prev) => ({
        ...prev,
        departmentId: value,
        departmentName: selected ? selected.name : '',
        specialty: selected?.specialties?.[0]?.name || prev.specialty
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { qualification: '', institution: '', year: new Date().getFullYear() }]
    }));
  };

  const handleQualificationChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.qualifications];
      updated[index][field] = value;
      return { ...prev, qualifications: updated };
    });
  };

  const handleRemoveQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.firstName || !formData.lastName) {
      setErrorMsg('First Name and Last Name are required.');
      return;
    }
    if (!formData.email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!formData.phone) {
      setErrorMsg('Primary phone number is required.');
      return;
    }
    if (!formData.departmentId) {
      setErrorMsg('Please select a primary department.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        consultationFee: Number(formData.consultationFee),
        consultationDurationMinutes: Number(formData.consultationDurationMinutes),
        qualifications: formData.qualifications.filter((q) => q.qualification.trim() !== '')
      };

      const res = await api.post('/doctors', payload);
      if (res.data.success) {
        setSuccessMsg(`Doctor record successfully created! Doctor ID: ${res.data.data.doctorId}`);
        setTimeout(() => {
          navigate(`/admin/doctors/${res.data.data.doctorId}`);
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create doctor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/admin/doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Doctor Directory
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus className="text-primary" /> Create Doctor Master Profile
          </h1>
          <p className="page-subtitle">Administrative Medical Practitioner Intake (Section 14 & 15)</p>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.08)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle color="#ef4444" size={20} />
          <span style={{ color: '#ef4444', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle color="#10b981" size={20} />
          <span style={{ color: '#10b981', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal Information */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Stethoscope size={18} className="text-primary" /> 1. Personal Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Title</label>
              <select className="form-control" name="title" value={formData.title} onChange={handleInputChange}>
                <option value="Dr.">Dr.</option>
                <option value="Prof. Dr.">Prof. Dr.</option>
                <option value="Assoc. Prof.">Assoc. Prof.</option>
                <option value="Consultant">Consultant</option>
              </select>
            </div>

            <div className="form-group">
              <label>First Name *</label>
              <input type="text" className="form-control" name="firstName" required value={formData.firstName} onChange={handleInputChange} placeholder="e.g. Amit" />
            </div>

            <div className="form-group">
              <label>Middle Name</label>
              <input type="text" className="form-control" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="e.g. Kumar" />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" className="form-control" name="lastName" required value={formData.lastName} onChange={handleInputChange} placeholder="e.g. Patel" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" className="form-control" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Primary Phone *</label>
              <input type="tel" className="form-control" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" />
            </div>

            <div className="form-group">
              <label>Alternate Phone</label>
              <input type="tel" className="form-control" name="alternatePhone" value={formData.alternatePhone} onChange={handleInputChange} placeholder="Optional contact" />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Official Email Address *</label>
              <input type="email" className="form-control" name="email" required value={formData.email} onChange={handleInputChange} placeholder="e.g. amit.patel@hospital.com" />
            </div>
          </div>
        </div>

        {/* Section 2: Department & Specialization */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Building size={18} className="text-primary" /> 2. Department & Clinical Assignment
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Primary Department *</label>
              <select className="form-control" name="departmentId" value={formData.departmentId} onChange={handleInputChange} required>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Specialization *</label>
              <input type="text" className="form-control" name="specialty" required value={formData.specialty} onChange={handleInputChange} placeholder="e.g. Interventional Cardiology" />
            </div>

            <div className="form-group">
              <label>Consultation Room / OPD Location</label>
              <input type="text" className="form-control" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} placeholder="e.g. OPD-201, Tower A" />
            </div>
          </div>
        </div>

        {/* Section 3: Professional Credentials & Registration */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <FileText size={18} className="text-primary" /> 3. Qualifications & Medical Registration
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label>Medical Registration Number</label>
              <input type="text" className="form-control" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} placeholder="e.g. REG-123456" />
            </div>

            <div className="form-group">
              <label>Registration Licensing Authority</label>
              <input type="text" className="form-control" name="registrationAuthority" value={formData.registrationAuthority} onChange={handleInputChange} placeholder="e.g. National Medical Commission / State Medical Council" />
            </div>

            <div className="form-group">
              <label>License Expiry Date</label>
              <input type="date" className="form-control" name="registrationExpiryDate" value={formData.registrationExpiryDate} onChange={handleInputChange} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Educational Qualifications</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQualification}>
                <Plus size={14} /> Add Degree
              </button>
            </div>

            {formData.qualifications.map((q, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Degree (e.g. MBBS, MD)"
                  value={q.qualification}
                  onChange={(e) => handleQualificationChange(idx, 'qualification', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Institution / University"
                  value={q.institution}
                  onChange={(e) => handleQualificationChange(idx, 'institution', e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Year"
                  value={q.year}
                  onChange={(e) => handleQualificationChange(idx, 'year', e.target.value)}
                  style={{ width: '100px' }}
                />
                {formData.qualifications.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveQualification(idx)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Consultation Configuration & Employment */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <DollarSign size={18} className="text-primary" /> 4. Consultation Settings & Association Status
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Default Slot Duration (Minutes)</label>
              <select className="form-control" name="consultationDurationMinutes" value={formData.consultationDurationMinutes} onChange={handleInputChange}>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Consultation Fee ({formData.currency})</label>
              <input type="number" className="form-control" name="consultationFee" value={formData.consultationFee} onChange={handleInputChange} min="0" step="50" />
            </div>

            <div className="form-group">
              <label>Employment Type</label>
              <select className="form-control" name="employmentType" value={formData.employmentType} onChange={handleInputChange}>
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONSULTANT">Consultant</option>
                <option value="VISITING">Visiting Specialist</option>
                <option value="RESIDENT">Resident Physician</option>
              </select>
            </div>

            <div className="form-group">
              <label>Initial Status</label>
              <select className="form-control" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Administrative Notes</label>
            <textarea
              className="form-control"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Internal onboarding notes or credential remarks..."
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
          <Link to="/admin/doctors" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Saving Doctor Record...' : 'Submit Doctor Record'}
          </button>
        </div>
      </form>
    </div>
  );
};
