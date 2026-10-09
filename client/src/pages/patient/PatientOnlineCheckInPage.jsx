import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import opdService from '../../services/opdService';
import { OPDTokenCard } from '../../components/opd/OPDTokenCard';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
  MapPin
} from 'lucide-react';

export const PatientOnlineCheckInPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [activeTokenData, setActiveTokenData] = useState(null);
  const [error, setError] = useState(null);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointments
      const res = await appointmentService.getAppointments({ limit: 50 });
      const list = res.appointments || res.data || [];
      setAppointments(list);

      // Check if patient already has an active OPD token today
      if (user?.patientId || user?.userId) {
        try {
          const tokenRes = await opdService.getPatientToken(user.patientId || user.userId);
          if (tokenRes?.data?.token) {
            setActiveTokenData(tokenRes.data);
          }
        } catch (e) {
          // No active token is fine
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleCheckIn = async (appointmentId) => {
    try {
      setCheckInLoading(true);
      setError(null);
      const res = await opdService.checkIn({
        appointmentId,
        channel: 'ONLINE_SELF_CHECKIN'
      });

      if (res.success || res.alreadyCheckedIn) {
        const tokenId = res.data?.tokenId || res.token?.tokenId;
        const detailsRes = await opdService.getTokenById(tokenId);
        setActiveTokenData(detailsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-in failed.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(
    (apt) => apt.appointmentDateStr === todayStr && apt.status !== 'CANCELLED'
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '1rem',
          padding: '1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem'
            }}
          >
            <Layers size={14} /> Self-Service OPD Desk
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            Online OPD Check-In
          </h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Confirm your arrival at the hospital to receive your OPD token and queue spot instantly.
          </p>
        </div>

        <button
          onClick={fetchPatientData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#f87171'
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Checked-In Token View */}
      {activeTokenData && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: '#f1f5f9' }}>
              Your Active OPD Token
            </h2>
            <button
              onClick={() => navigate(`/patient/queue/${activeTokenData.token.tokenId}`)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Open Live Tracker <ArrowRight size={16} />
            </button>
          </div>

          <OPDTokenCard
            token={activeTokenData.token}
            patientsAhead={activeTokenData.patientsAhead}
            estimatedWaitMinutes={activeTokenData.estimatedWaitMinutes}
          />
        </div>
      )}

      {/* Today's Appointments Eligible for Check-In */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#f1f5f9' }}>
          Today's Scheduled Appointments ({todayAppointments.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your appointments...
          </div>
        ) : todayAppointments.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Appointments Scheduled for Today
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              You don't have any appointments booked for today. You can schedule a new consultation via the booking portal.
            </p>
            <button
              onClick={() => navigate('/patient/appointments/book')}
              className="btn btn-primary"
              style={{ marginTop: '1.25rem' }}
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {todayAppointments.map((apt) => {
              const isCheckedIn = apt.status === 'CHECKED_IN' || apt.checkInStatus === 'CHECKED_IN';
              const isCompleted = apt.status === 'COMPLETED';

              return (
                <div
                  key={apt.appointmentId}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.85rem',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>
                        {apt.startTime}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.35rem',
                          background: isCheckedIn
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                          color: isCheckedIn ? '#10b981' : '#38bdf8'
                        }}
                      >
                        {isCheckedIn ? 'CHECKED IN' : apt.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                      Dr. {apt.doctorName}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {apt.departmentName} &bull; Room: {apt.roomNumber || 'OPD-101'}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                      ID: {apt.appointmentId}
                    </div>
                  </div>

                  <div>
                    {isCheckedIn ? (
                      <button
                        onClick={() => navigate('/patient/queue')}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <CheckCircle2 size={16} color="#10b981" /> View OPD Token
                      </button>
                    ) : isCompleted ? (
                      <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                        Consultation Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(apt.appointmentId)}
                        disabled={checkInLoading}
                        className="btn btn-primary"
                        style={{
                          padding: '0.85rem 1.75rem',
                          fontSize: '1rem',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                        }}
                      >
                        <Sparkles size={18} />
                        {checkInLoading ? 'Checking In...' : "I'M ARRIVED"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card on Check-in Policy */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <MapPin size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong style={{ color: '#f1f5f9' }}>OPD Check-In Policy:</strong> Online self check-in opens up to 3 hours before your scheduled appointment time. Once you check in, you will be assigned an OPD token and placed into the live doctor queue. Please wait in the designated consultation waiting area until your token number is announced.
        </div>
      </div>
    </div>
  );
};

export default PatientOnlineCheckInPage;
