import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { AppointmentDetailsModal } from '../../components/appointment/AppointmentDetailsModal';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  MapPin,
  CalendarOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DoctorAppointmentsPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctorId, setDoctorId] = useState(user?.linkedEntityId || 'DOC1001');
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('Medical Conference / Personal Leave');
  const [leaveNotice, setLeaveNotice] = useState(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true);
      const [doc, apptsRes] = await Promise.all([
        doctorService.getDoctorById(doctorId),
        appointmentService.getAppointments({
          doctorId,
          date: selectedDate,
          limit: 50
        })
      ]);
      setDoctorInfo(doc);
      setAppointments(apptsRes.appointments || []);
    } catch (err) {
      console.error('Failed to load doctor schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [doctorId, selectedDate]);

  const handleRecordLeave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingLeave(true);
      const res = await doctorService.recordLeave(doctorId, {
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason
      });
      setLeaveNotice(res.data);
      setIsLeaveModalOpen(false);
      fetchDoctorData();
    } catch (err) {
      alert(err.message || 'Failed to record leave.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const checkedInCount = appointments.filter((a) => a.checkInStatus === 'CHECKED_IN').length;
  const pendingArrivalCount = appointments.filter(
    (a) => a.status === 'CONFIRMED' && a.checkInStatus === 'NOT_CHECKED_IN'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Clinical OPD Schedule & Patient Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Doctor: <strong>{doctorInfo?.fullName || 'Dr. Rajesh Verma'}</strong> ({doctorInfo?.specialty || 'Cardiology'} • Room {doctorInfo?.roomNumber || 'OPD-201'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '160px' }}
          />

          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', gap: '0.35rem' }}
          >
            <CalendarOff size={15} />
            Record Leave
          </button>

          <button type="button" onClick={fetchDoctorData} className="btn btn-outline" style={{ gap: '0.35rem' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Leave Notification Banner */}
      {leaveNotice && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(245, 158, 11, 0.12)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={20} />
          <span>
            Leave recorded for {leaveNotice.leave.startDate} to {leaveNotice.leave.endDate}.{' '}
            <strong>{leaveNotice.affectedAppointmentsCount}</strong> booked appointments flagged for front-desk rescheduling.
          </span>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Scheduled Today</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.25rem' }}>
            {appointments.length}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrived & In Waiting</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ade80', marginTop: '0.25rem' }}>
            {checkedInCount}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected / Pending Arrival</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#facc15', marginTop: '0.25rem' }}>
            {pendingArrivalCount}
          </div>
        </div>
      </div>

      {/* Patients Schedule Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
            Patient Agenda for {selectedDate}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {appointments.length} Consultations Booked
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Patient Details</th>
                <th>Reason / Chief Complaint</th>
                <th>Type</th>
                <th>Status</th>
                <th>Check-In</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Clock size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <div>Loading clinic agenda...</div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No consultations scheduled for this date.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.appointmentId}>
                    <td>
                      <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{apt.startTime}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                        - {apt.endTime}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{apt.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {apt.patientId}</div>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{apt.reason || 'General checkup'}</div>
                      {apt.referringDoctorName && (
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                          Ref: {apt.referringDoctorName}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {apt.appointmentType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      <AppointmentStatusBadge status={apt.status} />
                    </td>

                    <td>
                      {apt.checkInStatus === 'CHECKED_IN' ? (
                        <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.8rem' }}>
                          ✓ In Waiting Area
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setIsDetailsOpen(true);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', gap: '0.35rem' }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        appointment={selectedAppointment}
      />

      {/* Record Leave Modal */}
      {isLeaveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Record Doctor Leave</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Flag leave dates to automatically stop new bookings and notify operations to reschedule any conflicting appointments.
            </p>

            <form onSubmit={handleRecordLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600' }}>
                  Start Date <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600' }}>
                  End Date <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  className="form-control"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="btn btn-outline"
                  disabled={isSubmittingLeave}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingLeave || !leaveStart || !leaveEnd}
                >
                  {isSubmittingLeave ? 'Submitting...' : 'Record Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
