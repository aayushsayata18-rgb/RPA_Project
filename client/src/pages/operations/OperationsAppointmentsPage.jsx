import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { AppointmentDetailsModal } from '../../components/appointment/AppointmentDetailsModal';
import { CancelAppointmentModal } from '../../components/appointment/CancelAppointmentModal';
import { RescheduleAppointmentModal } from '../../components/appointment/RescheduleAppointmentModal';
import { StatCard } from '../../components/common/StatCard';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Play,
  Bell,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  XCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OperationsAppointmentsPage = () => {
  const { user } = useAuth();

  // State
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const fetchStats = async () => {
    try {
      const s = await appointmentService.getStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const params = { limit: 100 };
      if (searchQuery) params.search = searchQuery;
      if (selectedDate) params.date = selectedDate;
      if (selectedDoctorId) params.doctorId = selectedDoctorId;
      if (selectedStatus) params.status = selectedStatus;

      const res = await appointmentService.getAppointments(params);
      setAppointments(res.appointments || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load appointments stream.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    doctorService.getDoctors().then((docs) => setDoctors(docs || []));
    fetchStats();
    fetchAppointments();
  }, [selectedDate, selectedDoctorId, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments();
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      setIsProcessingAction(true);
      await appointmentService.checkInAppointment(appointmentId);
      setSuccessMsg(`Patient checked in successfully for appointment ${appointmentId}.`);
      fetchAppointments();
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to check in patient.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTriggerNoShows = async () => {
    try {
      setIsProcessingAction(true);
      const res = await appointmentService.processNoShows({
        date: selectedDate || new Date().toISOString().slice(0, 10),
        gracePeriodMinutes: 30
      });
      setSuccessMsg(`No-Show automation executed: ${res.processedCount} appointments marked as NO_SHOW.`);
      fetchAppointments();
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to trigger No-Show processing.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTriggerReminders = async () => {
    try {
      setIsProcessingAction(true);
      const res = await appointmentService.triggerReminders();
      setSuccessMsg(`Automated reminder sweep completed: ${res.delivered} notices delivered.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process reminders.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmCancel = async (cancelData) => {
    try {
      setIsSubmittingModal(true);
      await appointmentService.cancelAppointment(selectedAppointment.appointmentId, cancelData);
      setSuccessMsg(`Appointment ${selectedAppointment.appointmentId} cancelled.`);
      setIsCancelOpen(false);
      fetchAppointments();
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleConfirmReschedule = async (rescheduleData) => {
    try {
      setIsSubmittingModal(true);
      const res = await appointmentService.rescheduleAppointment(selectedAppointment.appointmentId, rescheduleData);
      setSuccessMsg(`Appointment rescheduled to ${res.newAppointment.appointmentId}.`);
      setIsRescheduleOpen(false);
      fetchAppointments();
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reschedule appointment.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Operations Appointment Desk
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Central scheduling desk, real-time patient check-ins, capacity management & RPA job controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleTriggerNoShows}
            disabled={isProcessingAction}
            className="btn"
            style={{
              background: 'rgba(234, 179, 8, 0.12)',
              color: '#facc15',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              fontSize: '0.85rem',
              gap: '0.35rem'
            }}
          >
            <Play size={15} />
            Run No-Show Scanner
          </button>

          <button
            type="button"
            onClick={handleTriggerReminders}
            disabled={isProcessingAction}
            className="btn"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.85rem',
              gap: '0.35rem'
            }}
          >
            <Bell size={15} />
            Dispatch Reminders
          </button>

          <Link to="/patient/appointments/book" className="btn btn-primary" style={{ textDecoration: 'none', gap: '0.35rem', fontSize: '0.85rem' }}>
            <Plus size={16} />
            Book Patient
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <StatCard title="Today's Total" value={stats.today?.total || 0} icon={Calendar} color="primary" />
          <StatCard title="Confirmed" value={stats.today?.confirmed || 0} icon={CheckCircle} color="success" />
          <StatCard title="Checked-In" value={stats.today?.checkedIn || 0} icon={UserCheck} color="info" />
          <StatCard title="Cancelled" value={stats.today?.cancelled || 0} icon={XCircle} color="danger" />
          <StatCard title="Rescheduled" value={stats.today?.rescheduled || 0} icon={RotateCcw} color="warning" />
          <StatCard title="No-Shows" value={stats.today?.noShow || 0} icon={AlertCircle} color="secondary" />
        </div>
      )}

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

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 250px', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Patient Name, ID, or Appointment ID..."
              style={{ paddingLeft: '2.25rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: '160px', fontSize: '0.85rem' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: '180px', fontSize: '0.85rem' }}
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.fullName} ({d.specialty})
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '150px', fontSize: '0.85rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          {(selectedDate || selectedDoctorId || selectedStatus || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setSelectedDoctorId('');
                setSelectedStatus('');
                setSearchQuery('');
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Appointments Stream Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient Details</th>
                <th>Doctor & Specialty</th>
                <th>Date & Slot</th>
                <th>Status</th>
                <th>Arrival Check-In</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Clock size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <div>Loading operational appointment records...</div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No matching appointments found for the selected criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const isCheckInEligible =
                    apt.status === 'CONFIRMED' && apt.checkInStatus === 'NOT_CHECKED_IN';
                  const isCancellable = ['CONFIRMED', 'REQUESTED', 'SCHEDULED'].includes(apt.status);
                  const isReschedulable = ['CONFIRMED', 'REQUESTED', 'SCHEDULED'].includes(apt.status);

                  return (
                    <tr key={apt.appointmentId}>
                      <td>
                        <strong style={{ color: '#38bdf8' }}>{apt.appointmentId}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.source}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{apt.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ID: {apt.patientId} • {apt.patientPhone || 'No Phone'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '600' }}>{apt.doctorName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                          {apt.specialty} • Room {apt.roomNumber || 'OPD-101'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '600' }}>{apt.appointmentDateStr}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {apt.startTime} - {apt.endTime}
                        </div>
                      </td>

                      <td>
                        <AppointmentStatusBadge status={apt.status} />
                      </td>

                      <td>
                        {apt.checkInStatus === 'CHECKED_IN' ? (
                          <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: '600' }}>
                            ✓ Arrived & Checked In
                          </span>
                        ) : apt.checkInStatus === 'NO_SHOW' ? (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Absent (No-Show)</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending Arrival</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {isCheckInEligible && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(apt.appointmentId)}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Mark Arrival & Check-In"
                            >
                              Check-In
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setIsDetailsOpen(true);
                            }}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isReschedulable && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setIsRescheduleOpen(true);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              title="Reschedule"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {isCancellable && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setIsCancelOpen(true);
                              }}
                              className="btn"
                              style={{
                                padding: '0.3rem 0.5rem',
                                fontSize: '0.75rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.25)'
                              }}
                              title="Cancel Appointment"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        isSubmitting={isSubmittingModal}
      />

      <RescheduleAppointmentModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        appointment={selectedAppointment}
        onConfirmReschedule={handleConfirmReschedule}
        isSubmitting={isSubmittingModal}
      />
    </div>
  );
};
