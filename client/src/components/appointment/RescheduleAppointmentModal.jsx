import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SlotSelector } from './SlotSelector';
import { appointmentService } from '../../services/appointmentService';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export const RescheduleAppointmentModal = ({ isOpen, onClose, appointment, onConfirmReschedule, isSubmitting }) => {
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [reason, setReason] = useState('Patient requested different timing');
  const [errorMsg, setErrorMsg] = useState('');

  // Set min date to today
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (appointment && isOpen) {
      setNewDate('');
      setSlots([]);
      setSelectedSlot('');
      setErrorMsg('');
      setReason('Patient requested different timing');
    }
  }, [appointment, isOpen]);

  const handleDateChange = async (e) => {
    const dateVal = e.target.value;
    setNewDate(dateVal);
    setSelectedSlot('');
    setErrorMsg('');

    if (!dateVal || !appointment) return;

    try {
      setIsLoadingSlots(true);
      const res = await appointmentService.getAvailableSlots(appointment.doctorId, dateVal);
      setSlots(res.slots || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load doctor slots for this date.');
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newDate || !selectedSlot) {
      setErrorMsg('Please select a date and an available time slot.');
      return;
    }

    onConfirmReschedule({
      newDate,
      newStartTime: selectedSlot,
      reason
    });
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reschedule Appointment — ${appointment.appointmentId}`} maxWidth="550px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Current appointment info */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Booking:</div>
          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
            {appointment.doctorName} ({appointment.specialty})
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {appointment.appointmentDateStr} at {appointment.startTime} (Room: {appointment.roomNumber || 'OPD-101'})
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Date Selector */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: '600' }}>
            Select New Date <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            type="date"
            className="form-control"
            min={todayStr}
            value={newDate}
            onChange={handleDateChange}
            required
          />
        </div>

        {/* Slot Selector */}
        {newDate && (
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600' }}>
              Select Available Time Slot <span style={{ color: '#f87171' }}>*</span>
            </label>
            <SlotSelector
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={(time) => setSelectedSlot(time)}
              isLoading={isLoadingSlots}
            />
          </div>
        )}

        {/* Reason */}
        <div className="form-group">
          <label className="form-label">Reason for Rescheduling</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Schedule conflict, travel..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newDate || !selectedSlot || isSubmitting}
          >
            {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
