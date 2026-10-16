import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Calendar, Clock, CheckCircle, AlertTriangle, User, Radio, ArrowRight, XCircle, RefreshCw } from 'lucide-react';

export const RadiologyScheduling = () => {
  const [modalities, setModalities] = useState([]);
  const [selectedModalityId, setSelectedModalityId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersPendingScheduling, setOrdersPendingScheduling] = useState([]);

  // Booking Modal
  const [bookingSlot, setBookingSlot] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Reschedule Modal
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const fetchModalities = async () => {
    try {
      const res = await radiologyService.listModalities();
      if (res.data?.data && res.data.data.length > 0) {
        setModalities(res.data.data);
        if (!selectedModalityId) {
          setSelectedModalityId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch modalities:', err);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await radiologyService.listOrders({ status: 'PENDING_SCHEDULING' });
      if (res.data?.data) {
        setOrdersPendingScheduling(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
    }
  };

  const fetchSlotsAndSchedules = async () => {
    if (!selectedModalityId || !selectedDate) return;
    setLoading(true);
    try {
      const [availRes, schedRes] = await Promise.all([
        radiologyService.getAvailability({ modalityId: selectedModalityId, date: selectedDate }),
        radiologyService.listSchedules({ modalityId: selectedModalityId, date: selectedDate })
      ]);

      if (availRes.data?.data) {
        setAvailability(availRes.data.data);
      }
      if (schedRes.data?.data) {
        setSchedules(schedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModalities();
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (selectedModalityId && selectedDate) {
      fetchSlotsAndSchedules();
    }
  }, [selectedModalityId, selectedDate]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId || !bookingSlot) return;
    setBookingError('');
    setBookingSubmitting(true);

    try {
      await radiologyService.bookSchedule({
        orderId: selectedOrderId,
        modalityId: selectedModalityId,
        scheduledStart: bookingSlot.start,
        scheduledEnd: bookingSlot.end,
        notes: bookingNotes
      });

      setBookingSlot(null);
      setSelectedOrderId('');
      setBookingNotes('');
      fetchSlotsAndSchedules();
      fetchPendingOrders();
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to book slot.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await radiologyService.cancelSchedule(scheduleId, reason);
      fetchSlotsAndSchedules();
      fetchPendingOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Radiology Appointment Scheduling
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Concurrency-protected slot management, modality operating hours and booking calendar
          </p>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Modality / Suite:</label>
          <select
            value={selectedModalityId}
            onChange={(e) => setSelectedModalityId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
          >
            {modalities.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.room} - {m.type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        </div>

        <button
          onClick={fetchSlotsAndSchedules}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
        >
          <RefreshCw size={14} /> Refresh Slots
        </button>
      </div>

      {/* Main Grid: Pending Queue & Slot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Pending Orders Left Sidebar */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Orders Pending Booking</span>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1' }}>
              {ordersPendingScheduling.length}
            </span>
          </h3>

          {ordersPendingScheduling.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '16px 0' }}>No pending orders requiring scheduling.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
              {ordersPendingScheduling.map((ord) => (
                <div
                  key={ord._id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0284c7' }}>
                    <span>{ord.orderId}</span>
                    <span style={{ color: ord.priority === 'STAT' ? '#ef4444' : '#64748b' }}>{ord.priority}</span>
                  </div>
                  <div style={{ fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>{ord.patientName}</div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>{ord.examNameSnapshot}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>{ord.modalityTypeSnapshot}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Slots & Bookings Grid */}
        <div className="card" style={{ padding: '24px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
              Available Time Slots — {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#dcfce7', border: '1px solid #86efac' }}></span> Available Slot
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#eff6ff', border: '1px solid #bfdbfe' }}></span> Booked
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading slots...</div>
          ) : availability && !availability.available ? (
            <div style={{ padding: '20px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> {availability.reason}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {availability?.slots?.map((slot, idx) => {
                const startTimeStr = new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const booking = schedules.find(s => new Date(s.scheduledStart).getTime() === new Date(slot.start).getTime());

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: slot.available ? '1px solid #86efac' : '1px solid #bfdbfe',
                      background: slot.available ? '#f0fdf4' : '#eff6ff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '110px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: slot.available ? '#166534' : '#1e40af' }}>
                        {startTimeStr} - {endTimeStr}
                      </div>
                      {booking ? (
                        <div style={{ fontSize: '11px', color: '#1e3a8a', marginTop: '4px' }}>
                          <div style={{ fontWeight: '600' }}>{booking.patientName}</div>
                          <div style={{ color: '#3b82f6' }}>{booking.status}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                          Available ({slot.durationMinutes}m)
                        </div>
                      )}
                    </div>

                    <div>
                      {slot.available ? (
                        <button
                          onClick={() => {
                            setBookingSlot(slot);
                            setBookingError('');
                          }}
                          style={{
                            width: '100%',
                            padding: '5px',
                            borderRadius: '4px',
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Book Slot
                        </button>
                      ) : booking ? (
                        <button
                          onClick={() => handleCancelSchedule(booking._id)}
                          style={{
                            width: '100%',
                            padding: '4px',
                            borderRadius: '4px',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Book Slot Modal */}
      {bookingSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Confirm Appointment Slot
            </h3>
            <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px 0' }}>
              {new Date(bookingSlot.start).toLocaleDateString()} at{' '}
              <strong>{new Date(bookingSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> in{' '}
              <strong>{bookingSlot.room}</strong>
            </p>

            {bookingError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '14px', fontSize: '13px' }}>
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Select Order to Schedule *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="">-- Select Pending Order --</option>
                  {ordersPendingScheduling.map((ord) => (
                    <option key={ord._id} value={ord._id}>
                      {ord.orderId} - {ord.patientName} ({ord.examNameSnapshot})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Notes</label>
                <textarea
                  rows="2"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Special instructions or patient transport needs..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setBookingSlot(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {bookingSubmitting ? 'Confirming...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyScheduling;
