import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, Heart, Shield, Save, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { patientService } from '../../services/patientService';

export const PatientProfilePage = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      mobile: ''
    },
    communicationPreferences: {
      sms: true,
      email: true,
      whatsapp: false
    }
  });

  const patientId = user?.linkedEntityId || 'P10001';

  useEffect(() => {
    fetchProfile();
  }, [patientId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await patientService.getPatientById(patientId);
      if (res?.data) {
        setPatient(res.data);
        setFormData({
          mobile: res.data.mobile || '',
          email: res.data.email || '',
          address: res.data.address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: ''
          },
          emergencyContact: res.data.emergencyContact || {
            name: '',
            relationship: '',
            mobile: ''
          },
          communicationPreferences: res.data.communicationPreferences || {
            sms: true,
            email: true,
            whatsapp: false
          }
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await patientService.updatePatient(patientId, formData);
      if (res?.success) {
        setSuccessMsg('Profile details updated successfully & recorded in audit logs.');
        fetchProfile();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p className="text-secondary">Loading patient profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Patient Identity Profile</h1>
          <p className="page-subtitle">Permanent Hospital Master Identity • {patient?.patientId}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: patient?.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: patient?.status === 'ACTIVE' ? '#10b981' : '#ef4444',
              border: `1px solid ${patient?.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            STATUS: {patient?.status || 'ACTIVE'}
          </span>
        </div>
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
          <AlertCircle size={20} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        {/* Left Column: Immutable Master Identity Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(2, 132, 199, 0.2)',
                border: '2px solid #38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                marginBottom: '0.75rem'
              }}
            >
              <User size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
              {patient?.fullName || `${patient?.firstName} ${patient?.lastName}`}
            </h3>
            <span style={{ fontSize: '0.875rem', color: '#38bdf8', fontWeight: 600 }}>
              Permanent PID: {patient?.patientId}
            </span>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Date of Birth:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Gender:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{patient?.gender || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Blood Group:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{patient?.bloodGroup || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Registered Via:</span>
              <span style={{ color: '#cbd5e1' }}>{patient?.registrationSource || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Total Encounters:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{patient?.visits?.length || 0} Visits</span>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <Shield size={16} color="#38bdf8" />
            <span>Legal identity fields are immutable to protect medical safety.</span>
          </div>
        </div>

        {/* Right 2 Columns: Editable Demographic Information Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Permitted Profile Details
            </h3>

            {/* Contact Details */}
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Mobile Number (SMS Updates)
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Address */}
            <div style={{ marginTop: '1rem' }}>
              <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.address?.line1 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, line1: e.target.value }
                  })
                }
                className="input"
              />
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  City
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  State
                </label>
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>
              Emergency Contact
            </h3>
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="text-secondary text-sm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Emergency Mobile
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact?.mobile || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, mobile: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
            </div>

            {/* Communication Preferences */}
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>
              Notification Preferences
            </h3>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.communicationPreferences?.sms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      communicationPreferences: {
                        ...formData.communicationPreferences,
                        sms: e.target.checked
                      }
                    })
                  }
                />
                SMS Notifications
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.communicationPreferences?.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      communicationPreferences: {
                        ...formData.communicationPreferences,
                        email: e.target.checked
                      }
                    })
                  }
                />
                Email Notifications
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.communicationPreferences?.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      communicationPreferences: {
                        ...formData.communicationPreferences,
                        whatsapp: e.target.checked
                      }
                    })
                  }
                />
                WhatsApp Notifications
              </label>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
