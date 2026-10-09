import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { SlotSelector } from '../../components/appointment/SlotSelector';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MapPin,
  Building,
  Check
} from 'lucide-react';

export const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Steps: 1: Specialty -> 2: Doctor -> 3: Date & Slot -> 4: Review & Details -> 5: Confirmed
  const [step, setStep] = useState(1);

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Form State
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('NEW_CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [patientIdInput, setPatientIdInput] = useState(user?.linkedEntityId || user?.userId || 'P10001');

  // Loaders & Errors
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Confirmed Result
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setIsLoadingMaster(true);
        const [deps, docs] = await Promise.all([
          doctorService.getDepartments(),
          doctorService.getDoctors({ status: 'ACTIVE' })
        ]);
        setDepartments(deps || []);
        setDoctors(docs || []);
      } catch (err) {
        setErrorMsg('Failed to initialize booking catalog. Please try again.');
      } finally {
        setIsLoadingMaster(false);
      }
    };
    fetchMaster();
  }, []);

  // When date or doctor changes, fetch available slots
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const fetchSlots = async () => {
        try {
          setIsLoadingSlots(true);
          setErrorMsg('');
          const res = await appointmentService.getAvailableSlots(
            selectedDoctor.doctorId,
            selectedDate,
            appointmentType
          );
          setAvailableSlots(res.slots || []);
        } catch (err) {
          setErrorMsg(err.message || 'Failed to load doctor slots.');
          setAvailableSlots([]);
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDoctor, selectedDate, appointmentType]);

  const handleSelectDepartment = (depCode) => {
    setSelectedDepartment(depCode);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setStep(2);
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setSelectedSlot('');
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const payload = {
        patientId: patientIdInput,
        doctorId: selectedDoctor.doctorId,
        departmentId: selectedDoctor.departmentId,
        specialty: selectedDoctor.specialty,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        appointmentType,
        source: user?.role === 'PATIENT' ? 'PATIENT_PORTAL' : 'FRONT_DESK',
        reason: reason || 'General consultation',
        notes,
        idempotencyKey: `APT_BOOK_${patientIdInput}_${selectedDoctor.doctorId}_${selectedDate}_${selectedSlot}`
      };

      const result = await appointmentService.createAppointment(payload);
      setConfirmedAppointment(result.data || result);
      setStep(5);
    } catch (err) {
      setErrorMsg(err.message || 'The selected slot was taken. Please select another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = selectedDepartment
    ? doctors.filter((d) => d.departmentId === selectedDepartment)
    : doctors;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Book Doctor Appointment
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Instant scheduling with board-certified hospital consultants & departments.
          </p>
        </div>
        {step < 5 && (
          <Link to="/patient/appointments" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            Back to Appointments
          </Link>
        )}
      </div>

      {/* Wizard Progress Bar */}
      {step < 5 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            padding: '0.75rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          {[
            { num: 1, label: 'Specialty' },
            { num: 2, label: 'Doctor' },
            { num: 3, label: 'Date & Slot' },
            { num: 4, label: 'Review & Book' }
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isCurrent ? '#38bdf8' : isDone ? '#4ade80' : 'var(--text-muted)',
                  fontWeight: isCurrent ? '700' : '500',
                  fontSize: '0.85rem'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'rgba(56, 189, 248, 0.2)'
                      : isDone
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'var(--bg-secondary)',
                    border: isCurrent
                      ? '2px solid #38bdf8'
                      : isDone
                      ? '2px solid #4ade80'
                      : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}
                >
                  {isDone ? <Check size={14} /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT SPECIALTY / DEPARTMENT */}
      {step === 1 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Select Medical Department / Specialty</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('');
                setStep(2);
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Browse All Doctors Directly →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {departments.map((dep) => (
              <div
                key={dep.departmentId}
                onClick={() => handleSelectDepartment(dep.departmentId)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={18} color="#38bdf8" />
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {dep.name.replace('Department of ', '')}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {dep.description}
                </p>
                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Select Specialty</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DOCTOR */}
      {step === 2 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Choose a Doctor</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                {selectedDepartment ? `Showing specialists in ${selectedDepartment}` : 'Showing all active medical consultants'}
              </p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
              ← Change Department
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredDoctors.map((doc) => (
              <div
                key={doc.doctorId}
                onClick={() => handleSelectDoctor(doc)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                      {doc.fullName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '600' }}>
                      {doc.specialty}
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}
                  >
                    ₹{doc.consultationFee}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {doc.qualifications?.join(', ')} • {doc.experienceYears} Years Exp.
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Room: {doc.roomNumber}</span>
                  <span>Slot Duration: {doc.slotDurationMinutes || 30}m</span>
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                  <span>Check Availability</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SLOT SELECTION */}
      {step === 3 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Select Appointment Date & Time</h2>
              <p style={{ fontSize: '0.85rem', color: '#38bdf8', margin: '0.25rem 0 0', fontWeight: '600' }}>
                Consulting with {selectedDoctor?.fullName} ({selectedDoctor?.specialty})
              </p>
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
              ← Change Doctor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Appointment Type
              </label>
              <select
                className="form-select"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              >
                <option value="NEW_CONSULTATION">New Consultation</option>
                <option value="FOLLOW_UP">Follow-Up Visit</option>
                <option value="REFERRED_CONSULTATION">Doctor Referral</option>
                <option value="DIAGNOSTIC">Diagnostic Consultation</option>
                <option value="PROCEDURE">Minor Procedure</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Select Date <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="date"
                className="form-control"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                required
              />
            </div>
          </div>

          {/* Slots View */}
          {selectedDate ? (
            <div>
              <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Available Time Slots for {selectedDate}
              </label>
              <SlotSelector
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={(time) => setSelectedSlot(time)}
                isLoading={isLoadingSlots}
              />
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={32} style={{ margin: '0 auto 0.5rem', color: '#38bdf8' }} />
              <p>Please select an appointment date above to view real-time open slots.</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setStep(2)} className="btn btn-outline">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="btn btn-primary"
              disabled={!selectedDate || !selectedSlot}
            >
              Continue to Review →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Review & Confirm Appointment</h2>

          {/* Review Summary Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor & Department</span>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {selectedDoctor?.fullName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{selectedDoctor?.specialty}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Slot</span>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {selectedDate}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {selectedSlot} (Room: {selectedDoctor?.roomNumber})
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee</span>
              <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#34d399', marginTop: '0.2rem' }}>
                ₹{selectedDoctor?.consultationFee}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payable at clinic desk</div>
            </div>
          </div>

          {/* Form Fields: Reason & Patient Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {user?.role !== 'PATIENT' && (
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600' }}>
                  Patient ID <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. P10001"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Reason for Visit / Chief Symptoms <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Briefly describe your symptoms or reason for consulting the doctor..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Administrative Notes (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Wheelchair assistance, translation requirement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setStep(3)} className="btn btn-outline" disabled={isSubmitting}>
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="btn btn-primary"
              disabled={isSubmitting || !reason}
              style={{ minWidth: '160px' }}
            >
              {isSubmitting ? 'Booking Slot...' : 'Confirm & Book Now'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: BOOKING CONFIRMATION RECEIPT */}
      {step === 5 && confirmedAppointment && (
        <div
          className="card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            border: '2px solid rgba(34, 197, 94, 0.4)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={38} color="#4ade80" />
          </div>

          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#4ade80' }}>
              Appointment Confirmed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
              Your appointment has been successfully scheduled. SMS & Email confirmations have been dispatched with reminders.
            </p>
          </div>

          {/* Receipt Card */}
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.9rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Appointment ID:</span>
              <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>{confirmedAppointment.appointmentId}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>
              <strong>{confirmedAppointment.doctorName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Specialty / Dept:</span>
              <span>{confirmedAppointment.specialty}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
              <strong>{confirmedAppointment.appointmentDateStr} at {confirmedAppointment.startTime}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Clinic Room:</span>
              <span>{confirmedAppointment.roomNumber || 'OPD-101'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
              <code>{confirmedAppointment.bookingReference}</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/patient/appointments" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              View My Appointments
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedDepartment('');
                setSelectedDoctor(null);
                setSelectedDate('');
                setSelectedSlot('');
                setReason('');
                setConfirmedAppointment(null);
              }}
              className="btn btn-outline"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
