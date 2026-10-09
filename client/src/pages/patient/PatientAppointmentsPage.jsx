import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { AppointmentCard } from '../../components/appointment/AppointmentCard';
import { AppointmentDetailsModal } from '../../components/appointment/AppointmentDetailsModal';
import { CancelAppointmentModal } from '../../components/appointment/CancelAppointmentModal';
import { RescheduleAppointmentModal } from '../../components/appointment/RescheduleAppointmentModal';
import { Calendar, Plus, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PatientAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('UPCOMING');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await appointmentService.getAppointments({ limit: 50 });
      setAppointments(res.appointments || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter appointments by tab
  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'UPCOMING') {
      return (
        ['CONFIRMED', 'REQUESTED', 'SCHEDULED', 'PENDING_REVIEW'].includes(apt.status) &&
        apt.appointmentDateStr >= todayStr
      );
    }
    if (activeTab === 'PAST') {
      return (
        ['COMPLETED', 'NO_SHOW'].includes(apt.status) ||
        apt.appointmentDateStr < todayStr
      );
    }
    if (activeTab === 'CANCELLED') {
      return ['CANCELLED', 'RESCHEDULED'].includes(apt.status);
    }
    return true;
  });

  const upcomingCount = appointments.filter(
    (a) => ['CONFIRMED', 'REQUESTED', 'SCHEDULED', 'PENDING_REVIEW'].includes(a.status) && a.appointmentDateStr >= todayStr
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => ['CANCELLED', 'RESCHEDULED'].includes(a.status)).length;

  const handleOpenDetails = (apt) => {
    setSelectedAppointment(apt);
    setIsDetailsOpen(true);
  };

  const handleOpenCancel = (apt) => {
    setSelectedAppointment(apt);
    setIsCancelOpen(true);
  };

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt);
    setIsRescheduleOpen(true);
  };

  const handleConfirmCancel = async (cancelData) => {
    try {
      setIsSubmitting(true);
      await appointmentService.cancelAppointment(selectedAppointment.appointmentId, cancelData);
      setSuccessMsg(`Appointment ${selectedAppointment.appointmentId} has been successfully cancelled.`);
      setIsCancelOpen(false);
      fetchAppointments();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (rescheduleData) => {
    try {
      setIsSubmitting(true);
      const res = await appointmentService.rescheduleAppointment(selectedAppointment.appointmentId, rescheduleData);
      setSuccessMsg(`Appointment rescheduled! New Appointment ID: ${res.newAppointment.appointmentId}.`);
      setIsRescheduleOpen(false);
      fetchAppointments();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reschedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            My Appointments
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Manage doctor bookings, view consultation schedules, and reschedule or cancel anytime.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={fetchAppointments} className="btn btn-outline" style={{ gap: '0.5rem' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link to="/patient/appointments/book" className="btn btn-primary" style={{ gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={18} />
            Book New Appointment
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

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

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('UPCOMING')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'UPCOMING' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'UPCOMING' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: activeTab === 'UPCOMING' ? '700' : '500',
            border: activeTab === 'UPCOMING' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Calendar size={16} />
          Upcoming ({upcomingCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAST')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'PAST' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'PAST' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: activeTab === 'PAST' ? '700' : '500',
            border: activeTab === 'PAST' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Past & Completed ({completedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'CANCELLED' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'CANCELLED' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: activeTab === 'CANCELLED' ? '700' : '500',
            border: activeTab === 'CANCELLED' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Cancelled / Rescheduled ({cancelledCount})
        </button>
      </div>

      {/* Appointments Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <p>Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <Calendar size={48} color="var(--text-muted)" />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.25rem' }}>
              No {activeTab.toLowerCase()} appointments found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
              You don't have any appointments in this view. Would you like to schedule a consultation with our specialist doctors?
            </p>
          </div>
          <Link to="/patient/appointments/book" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
            Book an Appointment Now
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredAppointments.map((apt) => (
            <AppointmentCard
              key={apt.appointmentId}
              appointment={apt}
              userRole={user?.role || 'PATIENT'}
              onView={handleOpenDetails}
              onCancel={handleOpenCancel}
              onReschedule={handleOpenReschedule}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        appointment={selectedAppointment}
      />

      <CancelAppointmentModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        appointment={selectedAppointment}
        onConfirmCancel={handleConfirmCancel}
        isSubmitting={isSubmitting}
      />

      <RescheduleAppointmentModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        appointment={selectedAppointment}
        onConfirmReschedule={handleConfirmReschedule}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
